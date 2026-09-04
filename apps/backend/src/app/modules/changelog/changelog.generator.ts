import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import { Role, sendPromptToModel } from '../form/admin-form/ai-model'

import { ChangelogGenerationError } from './changelog.errors'
import { DigestItem, MergedPullRequest } from './changelog.types'

const logger = createLoggerWithLabel(module)

/**
 * Drafting goes through the same Azure OpenAI client as the form builder's
 * assistance feature, rather than a provider of its own.
 *
 * That is a deployment decision more than a technical one: those credentials
 * are already provisioned in every environment, so this needs no new key, no
 * new procurement, and no new dependency — which also sidesteps the pnpm trust
 * check that adding one currently trips.
 *
 * The model is whatever `AZURE_OPENAI_MODEL` names. The prompt does the work
 * here, and swapping the provider is a change to this file alone.
 */

/**
 * Safety ceiling on how many candidates one call may return. Not the digest
 * size — the digest takes the best few of these, and that decision belongs to
 * the service. This exists only so a runaway response cannot flood a log line
 * or a Slack post.
 */
export const MAX_DIGEST_CANDIDATES = 10

const SYSTEM_PROMPT = `You write a product update email for FormSG, the Singapore government's form building service.

Your readers are form admins: public officers who build and manage forms. They are not engineers. They do not know or care about our codebase, our release process, our internal project names, or our feature flags.

You will be given the pull requests merged since the last digest went out. Select every one that a form admin would genuinely care about, write each up for them, and order them most notable first.

Only the top few are actually sent, so the ordering carries real weight. Put the change that most affects a form admin's daily work first, and judge that by how many admins it touches and how much it changes what they can do — not by how much engineering went into it.

Most merged work is invisible to these readers. Translation groundwork, library and SDK upgrades, monitoring and logging, dead code removal, test changes, refactors, and version bumps are never worth reporting. Neither is anything that has landed but is still switched off for users.

It is normal and expected for a period to contain nothing worth announcing. Return an empty list when that is the case. Never pad the list, and never inflate the significance of internal work to make it sound user-facing — a period that yields too little is simply held over and reconsidered next time, so there is no cost to returning fewer items and a real cost to returning weak ones.

For each item you do select:
- Write the title as something the reader can do, in sentence case.
- Write the body as one or two sentences on what it lets them do, or what problem it removes.
- Use plain language. No version numbers, no flag names, no ticket or pull request references, no links, no marketing phrases such as "we are excited to announce".
- Describe only what the change actually does. Do not infer capabilities the pull requests do not describe.

Reply with a JSON object of this shape, and nothing outside it:

{"items": [{"title": string, "body": string, "sourcePullRequests": number[]}]}

- title: the sentence-case heading described above.
- body: the one or two sentences described above.
- sourcePullRequests: the numbers of the pull requests the item was drawn from. A reviewer uses these to check the claim against the change behind it; they are never shown to the reader, so do not refer to them in the title or body.

Return {"items": []} when nothing merits reporting.`

const buildUserPrompt = (pullRequests: MergedPullRequest[]): string => {
  const rendered = pullRequests
    .map((pr) => {
      const labels = pr.labels.length ? `\nLabels: ${pr.labels.join(', ')}` : ''
      // Bodies can be long and are mostly checklists; the opening is where any
      // description of user-visible behaviour lives.
      const body = pr.body ? `\n${pr.body.slice(0, 1500)}` : ''
      return `--- PR #${pr.number}\nTitle: ${pr.title}${labels}${body}`
    })
    .join('\n\n')

  return `Here are the pull requests merged during this period.\n\n${rendered}`
}

const parseItems = (raw: string): DigestItem[] => {
  const parsed = JSON.parse(raw) as { items?: DigestItem[] }
  return Array.isArray(parsed.items) ? parsed.items : []
}

/**
 * Drafts candidate digest items from merged pull requests, ranked most notable
 * first.
 *
 * Returns everything worth telling a form admin about rather than a digest's
 * worth: how many are needed, and whether there are enough to send at all, is
 * the service's decision. Returning an empty list is the common case and not a
 * failure.
 */
export const generateDigestItems = (
  pullRequests: MergedPullRequest[],
): ResultAsync<DigestItem[], ChangelogGenerationError> => {
  if (!pullRequests.length) {
    return okAsync([])
  }

  return sendPromptToModel({
    messages: [
      { role: Role.System, content: SYSTEM_PROMPT },
      { role: Role.User, content: buildUserPrompt(pullRequests) },
    ],
    options: {
      // Guarantees parseable JSON, not a particular shape. The shape is asked
      // for in the prompt and checked below.
      response_format: { type: 'json_object' },
    },
  })
    .mapErr((error) => {
      logger.error({
        message: 'Model request failed while drafting the digest',
        meta: {
          action: 'generateDigestItems',
          pullRequestCount: pullRequests.length,
        },
        error,
      })
      return new ChangelogGenerationError()
    })
    .andThen((text) => {
      if (!text) {
        return errAsync(new ChangelogGenerationError('Response was empty'))
      }

      let items: DigestItem[]
      try {
        items = parseItems(text)
      } catch (error) {
        logger.error({
          message: 'Could not parse digest items from response',
          meta: { action: 'generateDigestItems' },
          error,
        })
        return errAsync(
          new ChangelogGenerationError('Response was not valid JSON'),
        )
      }

      // The response format guarantees JSON, not this JSON, so the ceiling is
      // enforced here. Ranked output means the tail is what gets dropped.
      if (items.length > MAX_DIGEST_CANDIDATES) {
        logger.warn({
          message: 'More candidates than the ceiling allows; truncating',
          meta: { action: 'generateDigestItems', returned: items.length },
        })
        items = items.slice(0, MAX_DIGEST_CANDIDATES)
      }

      return okAsync(items)
    })
}
