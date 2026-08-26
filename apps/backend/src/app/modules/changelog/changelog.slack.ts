import axios from 'axios'
import { okAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'

import { ChangelogNotificationError } from './changelog.errors'
import { DigestDraft } from './changelog.types'

const logger = createLoggerWithLabel(module)

/**
 * Slack is a notification surface, not a control surface. It carries the draft
 * so a reviewer can see what was written without opening anything, and that is
 * all. Approve and reject buttons would need a publicly reachable endpoint with
 * request signature verification and its own permissions layer, and rejecting
 * with changes would mean editing copy in a Slack modal, which is worse than
 * editing it anywhere else.
 *
 * Pull request numbers appear here but never in the email. This is where a
 * reviewer checks a claim against the change that produced it.
 */
const buildMessage = (draft: DigestDraft, sentTo: string) => {
  const { items, window, consideredPullRequests } = draft

  const header = items.length
    ? `Digest draft ready: ${items.length} item${items.length === 1 ? '' : 's'}`
    : 'Nothing to announce this cycle'

  const context = `${window.since} to ${window.until} · ${consideredPullRequests} merged PR${
    consideredPullRequests === 1 ? '' : 's'
  } considered`

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: header },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: context }],
    },
  ]

  for (const item of items) {
    const sources = item.sourcePullRequests.length
      ? `\n_from ${item.sourcePullRequests.map((n) => `#${n}`).join(', ')}_`
      : ''
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${item.title}*\n${item.body}${sources}` },
    })
  }

  if (items.length) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Preview emailed to ${sentTo}. Nothing has been sent to form admins.`,
        },
      ],
    })
  }

  return { text: header, blocks }
}

/**
 * Posts the draft to Slack. A missing webhook is not an error: the digest is
 * still generated and previewed, and local runs should not need Slack
 * configured to be useful.
 */
export const notifySlack = (
  draft: DigestDraft,
  sentTo: string,
): ResultAsync<boolean, ChangelogNotificationError> => {
  const { slackWebhookUrl } = changelogDigestConfig

  if (!slackWebhookUrl) {
    logger.info({
      message: 'No Slack webhook configured; skipping notification',
      meta: { action: 'notifySlack' },
    })
    return okAsync(false)
  }

  return ResultAsync.fromPromise(
    axios.post(slackWebhookUrl, buildMessage(draft, sentTo)),
    (error) => {
      logger.error({
        message: 'Failed to post digest draft to Slack',
        meta: { action: 'notifySlack', itemCount: draft.items.length },
        error,
      })
      return new ChangelogNotificationError()
    },
  ).map(() => true)
}
