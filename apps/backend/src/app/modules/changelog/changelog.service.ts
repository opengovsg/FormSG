import { errAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'
import {
  MailGenerationError,
  MailSendError,
} from '../../services/mail/mail.errors'
import MailService from '../../services/mail/mail.service'

import {
  ChangelogGenerationError,
  ChangelogNotConfiguredError,
  ChangelogNotificationError,
  ChangelogSourceFetchError,
} from './changelog.errors'
import { generateDigestItems } from './changelog.generator'
import { notifySlack } from './changelog.slack'
import { getMergedPullRequests } from './changelog.sources'
import { DigestDraft, DigestWindow } from './changelog.types'

const logger = createLoggerWithLabel(module)

/**
 * Where the call to action points. Deliberately the public site rather than
 * config.app.appUrl: the reader is a form admin reading their own mail, not
 * someone browsing whichever environment generated the digest.
 */
export const DIGEST_CTA_URL = 'https://form.gov.sg'

const DIGEST_SUBJECT = "What's new on FormSG"

export type GenerateDigestError =
  | ChangelogNotConfiguredError
  | ChangelogSourceFetchError
  | ChangelogGenerationError
  | ChangelogNotificationError
  | MailGenerationError
  | MailSendError

/**
 * Runs one digest cycle: read what merged, draft items, email a preview, and
 * post the draft to Slack.
 *
 * The preview goes to a single configured address. There is no code path from
 * here to the real admin list, and there should not be one until the approval
 * flow described in the RFC exists.
 */
export const generateAndPreviewDigest = (
  window: DigestWindow,
): ResultAsync<DigestDraft, GenerateDigestError> => {
  const { previewRecipient } = changelogDigestConfig

  if (!previewRecipient) {
    return errAsync(
      new ChangelogNotConfiguredError('CHANGELOG_PREVIEW_RECIPIENT is not set'),
    )
  }

  return getMergedPullRequests(window)
    .andThen((pullRequests) =>
      generateDigestItems(pullRequests).map((items) => ({
        items,
        window,
        consideredPullRequests: pullRequests.length,
      })),
    )
    .andThen((draft: DigestDraft) => {
      logger.info({
        message: 'Digest drafted',
        meta: {
          action: 'generateAndPreviewDigest',
          window,
          consideredPullRequests: draft.consideredPullRequests,
          itemCount: draft.items.length,
        },
      })

      // A cycle with nothing worth announcing is the common case. Slack still
      // hears about it so the quiet cycle is visible rather than looking like
      // a job that failed silently.
      if (!draft.items.length) {
        return notifySlack(draft, previewRecipient).map(() => draft)
      }

      return MailService.sendChangelogDigest({
        to: previewRecipient,
        subject: DIGEST_SUBJECT,
        items: draft.items.map(({ title, body }) => ({ title, body })),
        ctaUrl: DIGEST_CTA_URL,
      })
        .andThen(() => notifySlack(draft, previewRecipient))
        .map(() => draft)
    })
    .orElse((error) => {
      logger.error({
        message: 'Digest cycle failed',
        meta: { action: 'generateAndPreviewDigest', window },
        error,
      })
      return errAsync(error)
    })
}

/** Exported for the controller's default window. */
export const defaultWindow = (today: Date, days = 14): DigestWindow => {
  const until = new Date(today)
  const since = new Date(today)
  since.setUTCDate(since.getUTCDate() - days)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { since: iso(since), until: iso(until) }
}
