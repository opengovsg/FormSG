import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'
import getChangelogDigestModel from '../../models/changelog_digest.server.model'
import {
  MailGenerationError,
  MailSendError,
} from '../../services/mail/mail.errors'
import MailService from '../../services/mail/mail.service'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

import {
  ChangelogGenerationError,
  ChangelogNotConfiguredError,
  ChangelogNotificationError,
  ChangelogSourceFetchError,
} from './changelog.errors'
import { generateDigestItems } from './changelog.generator'
import { notifySlack } from './changelog.slack'
import { getMergedPullRequests } from './changelog.sources'
import { DigestCycleResult, DigestDraft, DigestWindow } from './changelog.types'

const logger = createLoggerWithLabel(module)

const ChangelogDigestModel = getChangelogDigestModel(mongoose)

/**
 * How many items a digest carries, and the number required before one is sent
 * at all.
 *
 * Both meanings are the same number on purpose. A digest of one or two items
 * reads as though we had nothing to say, and the fix is not to lower the bar
 * but to wait: the changes are held over and reconsidered next cycle against
 * whatever else has landed. Two quiet weeks then produce one digest of the
 * best three rather than two thin ones.
 */
export const DIGEST_ITEM_COUNT = 3

/**
 * How far back the very first cycle looks, before any digest has been sent and
 * there is no watermark to read.
 */
const FIRST_RUN_LOOKBACK_DAYS = 7

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
  | DatabaseError

/**
 * The window the next cycle should cover: everything merged since the last
 * digest was *sent*, up to now.
 *
 * Not "since the job last ran". A cycle that finds too little to send records
 * nothing, so the watermark stays put and those changes come round again next
 * week alongside whatever is new. That is what lets two quiet weeks produce a
 * single digest of the best three items.
 *
 * The previous window's `until` becomes this one's `since` unchanged. Because
 * `since` is exclusive and `until` inclusive, consecutive windows abut exactly:
 * nothing merged between two cycles is missed, and nothing is seen twice.
 */
export const nextDigestWindow = (
  now: Date,
): ResultAsync<DigestWindow, DatabaseError> =>
  ResultAsync.fromPromise(ChangelogDigestModel.getLastSent(), (error) => {
    logger.error({
      message: 'Could not read the last sent digest',
      meta: { action: 'nextDigestWindow' },
      error,
    })
    return transformMongoError(error)
  }).map((lastSent) => {
    const until = now.toISOString()
    if (lastSent) return { since: lastSent.window.until, until }

    const since = new Date(now)
    since.setUTCDate(since.getUTCDate() - FIRST_RUN_LOOKBACK_DAYS)
    return { since: since.toISOString(), until }
  })

const recordSentDigest = (
  window: DigestWindow,
  items: DigestDraft['items'],
  recipients: string[],
): ResultAsync<true, DatabaseError> =>
  ResultAsync.fromPromise(
    ChangelogDigestModel.create({
      sentAt: new Date(),
      window,
      items,
      recipients,
    }),
    (error) => {
      logger.error({
        message: 'Digest was sent but could not be recorded',
        meta: { action: 'recordSentDigest', window },
        error,
      })
      return transformMongoError(error)
    },
  ).map(() => true as const)

/**
 * Runs one digest cycle: read what merged since the last digest went out,
 * draft and rank candidates, and send the best three — but only if there are
 * three. Anything less is held over.
 *
 * The preview goes to a single configured address. There is no code path from
 * here to the real admin list, and there should not be one until the approval
 * flow described in the RFC exists.
 */
export const generateAndPreviewDigest = (
  window: DigestWindow,
): ResultAsync<DigestCycleResult, GenerateDigestError> => {
  const { previewRecipient } = changelogDigestConfig

  if (!previewRecipient) {
    return errAsync(
      new ChangelogNotConfiguredError('CHANGELOG_PREVIEW_RECIPIENT is not set'),
    )
  }

  return getMergedPullRequests(window)
    .andThen((pullRequests) =>
      generateDigestItems(pullRequests).map<DigestDraft>((items) => ({
        items,
        window,
        consideredPullRequests: pullRequests.length,
      })),
    )
    .andThen<DigestCycleResult, GenerateDigestError>((draft: DigestDraft) => {
      const candidateCount = draft.items.length

      logger.info({
        message: 'Digest drafted',
        meta: {
          action: 'generateAndPreviewDigest',
          window,
          consideredPullRequests: draft.consideredPullRequests,
          candidateCount,
        },
      })

      // Too little to be worth a digest. Slack still hears about it, so a quiet
      // cycle is visible rather than looking like a job that failed silently,
      // and nothing is recorded — these changes come round again next week.
      if (candidateCount < DIGEST_ITEM_COUNT) {
        logger.info({
          message: 'Not enough notable changes; holding over',
          meta: {
            action: 'generateAndPreviewDigest',
            window,
            candidateCount,
            required: DIGEST_ITEM_COUNT,
          },
        })

        return notifySlack(draft, previewRecipient).map(() => ({
          outcome: 'skipped' as const,
          draft,
          sentItems: [],
          candidateCount,
        }))
      }

      // Ranked most notable first, so the top three are the best three.
      const sentItems = draft.items.slice(0, DIGEST_ITEM_COUNT)

      return MailService.sendChangelogDigest({
        to: previewRecipient,
        subject: DIGEST_SUBJECT,
        items: sentItems.map(({ title, body }) => ({ title, body })),
        ctaUrl: DIGEST_CTA_URL,
      })
        .andThen(() => recordSentDigest(window, sentItems, [previewRecipient]))
        .andThen(() =>
          notifySlack({ ...draft, items: sentItems }, previewRecipient),
        )
        .andThen(() =>
          okAsync({
            outcome: 'sent' as const,
            draft,
            sentItems,
            candidateCount,
          }),
        )
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
