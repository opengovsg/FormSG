import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'
import getChangelogDigestModel, {
  IChangelogDigestSchema,
} from '../../models/changelog_digest.server.model'
import {
  MailGenerationError,
  MailSendError,
} from '../../services/mail/mail.errors'
import MailService from '../../services/mail/mail.service'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

import {
  ChangelogDigestNotApprovableError,
  ChangelogDigestNotFoundError,
  ChangelogGenerationError,
  ChangelogNotConfiguredError,
  ChangelogNotificationError,
  ChangelogSourceFetchError,
} from './changelog.errors'
import { generateDigestItems } from './changelog.generator'
import { notifySlack } from './changelog.slack'
import { getMergedPullRequests } from './changelog.sources'
import { DigestWindow } from './changelog.types'

const logger = createLoggerWithLabel(module)

const ChangelogDigestModel = getChangelogDigestModel(mongoose)

/**
 * Where the call to action points. Deliberately the public site rather than
 * config.app.appUrl: the reader is a form admin reading their own mail, not
 * someone browsing whichever environment generated the digest.
 */
export const DIGEST_CTA_URL = 'https://form.gov.sg'

const DIGEST_SUBJECT = "What's new on FormSG"

/**
 * How many items a digest carries, and the number required before one can be
 * sent at all.
 *
 * Both meanings are the same number on purpose. A digest of one or two items
 * reads as though we had nothing to say, and the fix is not to lower the bar
 * but to wait: the changes are held over and reconsidered next cycle against
 * whatever else has landed. Two quiet weeks then produce one digest of the best
 * three rather than two thin ones.
 */
export const DIGEST_ITEM_COUNT = 3

/**
 * How far back the very first cycle looks, before any digest has been sent and
 * there is no earlier window to continue from.
 */
const FIRST_RUN_LOOKBACK_DAYS = 7

export type GenerateDigestError =
  | ChangelogNotConfiguredError
  | ChangelogSourceFetchError
  | ChangelogGenerationError
  | ChangelogNotificationError
  | DatabaseError

export type ApproveDigestError =
  | ChangelogNotConfiguredError
  | ChangelogDigestNotFoundError
  | ChangelogDigestNotApprovableError
  | ChangelogNotificationError
  | MailGenerationError
  | MailSendError
  | DatabaseError

/**
 * The ISO 8601 week a date falls in, as `2026-W35`.
 *
 * ISO weeks start on Monday and belong to the year containing their Thursday,
 * which is why this is not simply "day of year over seven" — the first days of
 * January frequently belong to the previous year's last week, and getting that
 * wrong would let one calendar week generate two digests.
 */
export const isoWeek = (date: Date): string => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  // Shift to the Thursday of this week; that day's year is the ISO year.
  const dayNumber = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber)

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  )

  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

const readLastSent = (): ResultAsync<
  IChangelogDigestSchema | null,
  DatabaseError
> =>
  ResultAsync.fromPromise(ChangelogDigestModel.getLastSent(), (error) => {
    logger.error({
      message: 'Could not read the last sent digest',
      meta: { action: 'readLastSent' },
      error,
    })
    return transformMongoError(error)
  })

/**
 * The span the next cycle should cover: everything merged since a digest was
 * last *sent*, up to now.
 *
 * Not "since the job last ran", and not "since one was last generated". A week
 * that was held or superseded told readers nothing, so it must not move the
 * line — otherwise its changes would be stepped over and never reported.
 *
 * The previous window's `until` becomes this one's `since` unchanged. Because
 * `since` is exclusive and `until` inclusive, consecutive windows abut exactly:
 * nothing between cycles is missed, and nothing is seen twice.
 */
const windowSinceLastSent = (
  now: Date,
  lastSent: IChangelogDigestSchema | null,
): DigestWindow => {
  const until = now.toISOString()
  if (lastSent) return { since: lastSent.window.until, until }

  const since = new Date(now)
  since.setUTCDate(since.getUTCDate() - FIRST_RUN_LOOKBACK_DAYS)
  return { since: since.toISOString(), until }
}

/**
 * Drafts this week's digest and persists it. Sends nothing.
 *
 * Idempotent within a week: the second run finds the first run's row and
 * returns it untouched. That is enforced by a unique index on the week rather
 * than by looking before inserting, so two runs racing cannot both draft.
 *
 * A cycle that finds fewer than DIGEST_ITEM_COUNT items still records a row, as
 * `held`. It has to: without one, "already generated this week" would be false
 * and a re-run would draft again. Its changes are not lost — the next cycle's
 * window still reaches back to the last sent digest.
 */
export const generateDigest = (
  now: Date,
): ResultAsync<IChangelogDigestSchema, GenerateDigestError> => {
  const week = isoWeek(now)

  return ResultAsync.fromPromise(
    ChangelogDigestModel.getByWeek(week),
    (error) => {
      logger.error({
        message: 'Could not look up this week’s digest',
        meta: { action: 'generateDigest', week },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((existing) => {
    if (existing) {
      logger.info({
        message: 'Digest already generated for this week; nothing to do',
        meta: {
          action: 'generateDigest',
          week,
          digestId: String(existing._id),
          status: existing.status,
        },
      })
      return okAsync(existing)
    }

    return readLastSent()
      .map((lastSent) => windowSinceLastSent(now, lastSent))
      .andThen((window) =>
        getMergedPullRequests(window).andThen((pullRequests) =>
          generateDigestItems(pullRequests).map((items) => ({
            window,
            items,
            consideredPullRequests: pullRequests.length,
          })),
        ),
      )
      .andThen(({ window, items, consideredPullRequests }) => {
        const hasEnough = items.length >= DIGEST_ITEM_COUNT

        logger.info({
          message: 'Digest drafted',
          meta: {
            action: 'generateDigest',
            week,
            window,
            consideredPullRequests,
            candidateCount: items.length,
            hasEnough,
          },
        })

        // A new draft covers a strict superset of any older unapproved one, so
        // approving the old one would send a digest missing the latest week.
        const supersede = hasEnough
          ? ResultAsync.fromPromise(
              ChangelogDigestModel.supersedeOpenDrafts(),
              (error) => {
                logger.error({
                  message: 'Could not supersede open drafts',
                  meta: { action: 'generateDigest', week },
                  error,
                })
                return transformMongoError(error)
              },
            )
          : okAsync(0)

        return supersede.andThen((supersededCount) => {
          if (supersededCount) {
            logger.info({
              message: 'Superseded older drafts that were never approved',
              meta: { action: 'generateDigest', week, supersededCount },
            })
          }

          return ResultAsync.fromPromise(
            ChangelogDigestModel.create({
              week,
              status: hasEnough ? 'draft' : 'held',
              generatedAt: now,
              window,
              items,
              recipients: [],
            }),
            (error) => {
              logger.error({
                message: 'Could not persist the drafted digest',
                meta: { action: 'generateDigest', week },
                error,
              })
              return transformMongoError(error)
            },
          )
        })
      })
      .andThen((digest) =>
        // Slack hears about every cycle, including a quiet one, so silence is
        // never mistaken for a job that failed.
        notifySlack(
          {
            items: digest.items,
            window: digest.window,
            consideredPullRequests: 0,
          },
          changelogDigestConfig.previewRecipient,
        ).map(() => digest),
      )
  })
}

/**
 * Approves a drafted digest and emails it.
 *
 * This is the only path that sends mail, and it goes to the single configured
 * address. There is no code path from here to the real admin list, and there
 * should not be one until the approval flow described in the RFC exists.
 */
export const approveDigest = (
  digestId: string,
): ResultAsync<IChangelogDigestSchema, ApproveDigestError> => {
  const { previewRecipient } = changelogDigestConfig

  if (!previewRecipient) {
    return errAsync(
      new ChangelogNotConfiguredError('CHANGELOG_PREVIEW_RECIPIENT is not set'),
    )
  }

  return ResultAsync.fromPromise(
    ChangelogDigestModel.findById(digestId).exec(),
    (error) => {
      logger.error({
        message: 'Could not read the digest',
        meta: { action: 'approveDigest', digestId },
        error,
      })
      return transformMongoError(error)
    },
  )
    .andThen((digest) => {
      if (!digest) return errAsync(new ChangelogDigestNotFoundError())

      if (digest.status !== 'draft') {
        // Naming the status matters: "cannot approve" alone sends whoever reads
        // the log to the database to find out why.
        return errAsync(
          new ChangelogDigestNotApprovableError(
            `Digest for ${digest.week} is ${digest.status}, not a draft`,
          ),
        )
      }

      return okAsync(digest)
    })
    .andThen((digest) => {
      // Ranked most notable first, so the top three are the best three.
      const sentItems = digest.items.slice(0, DIGEST_ITEM_COUNT)

      return MailService.sendChangelogDigest({
        to: previewRecipient,
        subject: DIGEST_SUBJECT,
        items: sentItems.map(({ title, body }) => ({ title, body })),
        ctaUrl: DIGEST_CTA_URL,
      })
        .andThen(() =>
          ResultAsync.fromPromise(
            ChangelogDigestModel.findByIdAndUpdate(
              digest._id,
              {
                $set: {
                  status: 'sent',
                  sentAt: new Date(),
                  recipients: [previewRecipient],
                },
              },
              { new: true },
            ).exec(),
            (error) => {
              logger.error({
                // The mail is already gone. Left as a draft, it would be sent
                // again on the next approval and the window would never move.
                message: 'Digest was emailed but could not be marked sent',
                meta: { action: 'approveDigest', digestId },
                error,
              })
              return transformMongoError(error)
            },
          ),
        )
        .andThen((updated) =>
          updated
            ? okAsync(updated)
            : errAsync(new ChangelogDigestNotFoundError()),
        )
    })
    .map((digest) => {
      logger.info({
        message: 'Digest approved and sent',
        meta: {
          action: 'approveDigest',
          digestId,
          week: digest.week,
          itemCount: Math.min(digest.items.length, DIGEST_ITEM_COUNT),
        },
      })
      return digest
    })
}

/** Recent digests, newest first, so an id can be found to approve. */
export const listDigests = (
  limit: number,
): ResultAsync<IChangelogDigestSchema[], DatabaseError> =>
  ResultAsync.fromPromise(ChangelogDigestModel.listRecent(limit), (error) => {
    logger.error({
      message: 'Could not list digests',
      meta: { action: 'listDigests' },
      error,
    })
    return transformMongoError(error)
  })
