import axios from 'axios'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'

import { ChangelogGenerationError } from './changelog.errors'
import { DigestItem, MergedPullRequest } from './changelog.types'

const logger = createLoggerWithLabel(module)

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = 'claude-opus-5'

/**
 * The official @anthropic-ai/sdk would be preferable here, but adding any new
 * dependency currently fails this repo's pnpm trust check on semver@5.7.2
 * (a transitive dependency of webpack@4). Resolving that is a repo-wide
 * supply chain decision rather than something to settle in a feature branch,
 * so this calls the Messages API over axios, which is already a dependency.
 * Swapping to the SDK is a change to this file alone.
 */

/**
 * Safety ceiling on how many candidates one call may return. Not the digest
 * size — the digest takes the best few of these, and that decision belongs to
 * the service. This exists only so a runaway response cannot flood a log line
 * or a Slack post.
 */
export const MAX_DIGEST_CANDIDATES = 10

const DIGEST_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description:
        'Every change worth telling a form admin about, ordered most notable first. May be empty.',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description:
              "Sentence-case heading describing the change in the reader's terms. No version numbers, no feature flag names, no internal project names.",
          },
          body: {
            type: 'string',
            description:
              'One or two sentences on what this lets the reader do. No links, no jargon, no references to pull requests or tickets.',
          },
          sourcePullRequests: {
            type: 'array',
            description:
              'Numbers of the pull requests this item was drawn from. Used by the reviewer to verify the claim; never shown to the reader.',
            items: { type: 'integer' },
          },
        },
        required: ['title', 'body', 'sourcePullRequests'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const

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
- Describe only what the change actually does. Do not infer capabilities the pull requests do not describe.`

type AnthropicResponse = {
  stop_reason: string
  content: { type: string; text?: string }[]
}

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
  const { anthropicApiKey } = changelogDigestConfig

  if (!anthropicApiKey) {
    return errAsync(
      new ChangelogGenerationError('ANTHROPIC_API_KEY is not set'),
    )
  }

  if (!pullRequests.length) {
    return okAsync([])
  }

  return ResultAsync.fromPromise(
    axios.post<AnthropicResponse>(
      ANTHROPIC_MESSAGES_URL,
      {
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        output_config: {
          format: { type: 'json_schema', schema: DIGEST_SCHEMA },
        },
        messages: [{ role: 'user', content: buildUserPrompt(pullRequests) }],
      },
      {
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
        },
      },
    ),
    (error) => {
      logger.error({
        message: 'Anthropic request failed',
        meta: {
          action: 'generateDigestItems',
          pullRequestCount: pullRequests.length,
        },
        error,
      })
      return new ChangelogGenerationError()
    },
  ).andThen(({ data }) => {
    if (data.stop_reason === 'refusal') {
      logger.error({
        message: 'Anthropic declined the digest request',
        meta: { action: 'generateDigestItems' },
      })
      return errAsync(
        new ChangelogGenerationError('Request was declined by the model'),
      )
    }

    const text = data.content.find((block) => block.type === 'text')?.text
    if (!text) {
      return errAsync(
        new ChangelogGenerationError('Response contained no text block'),
      )
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

    // The schema cannot express a maximum array length, so the safety ceiling
    // is enforced here. Ranked output means the tail is what gets dropped.
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
