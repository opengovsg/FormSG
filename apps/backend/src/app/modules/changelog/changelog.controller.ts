import { celebrate, Joi, Segments } from 'celebrate'
import { ErrorDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { IChangelogDigestSchema } from '../../models/changelog_digest.server.model'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import {
  ChangelogDigestNotApprovableError,
  ChangelogDigestNotFoundError,
  ChangelogNotConfiguredError,
} from './changelog.errors'
import {
  approveDigest,
  DIGEST_ITEM_COUNT,
  generateDigest,
  listDigests,
} from './changelog.service'

const logger = createLoggerWithLabel(module)

const DEFAULT_LIST_LIMIT = 10

/**
 * What a digest looks like from outside. `items` carries every candidate the
 * generator returned; only the first DIGEST_ITEM_COUNT are ever emailed, and
 * seeing the rest is the point of looking at a draft before approving it.
 */
type DigestView = {
  digestId: string
  week: string
  status: IChangelogDigestSchema['status']
  window: IChangelogDigestSchema['window']
  generatedAt: Date
  sentAt?: Date
  itemCount: number
  /** How many of those would be emailed on approval. */
  sendableCount: number
  items: IChangelogDigestSchema['items']
  recipients: string[]
}

const toView = (digest: IChangelogDigestSchema): DigestView => ({
  digestId: String(digest._id),
  week: digest.week,
  status: digest.status,
  window: digest.window,
  generatedAt: digest.generatedAt,
  sentAt: digest.sentAt,
  itemCount: digest.items.length,
  sendableCount: Math.min(digest.items.length, DIGEST_ITEM_COUNT),
  items: digest.items,
  recipients: digest.recipients,
})

/**
 * Drafts this week's digest and persists it. Sends nothing.
 *
 * Safe to call repeatedly: the second call in a week returns the first call's
 * digest untouched. That is what lets the schedule and a person share one
 * endpoint without racing each other.
 *
 * @route POST /cron/generate-digest
 * @returns 200 with the digest, whether newly drafted or already existing
 * @returns 401 if the shared secret is missing or wrong
 * @returns 500 if the cycle failed
 */
export const handleGenerateDigest: ControllerHandler<
  never,
  DigestView | ErrorDto
> = (req, res) => {
  return generateDigest(new Date())
    .map((digest) => res.status(StatusCodes.OK).json(toView(digest)))
    .mapErr((error) => {
      logger.error({
        message: 'Failed to generate digest',
        meta: { action: 'handleGenerateDigest', ...createReqMeta(req) },
        error,
      })

      if (error instanceof ChangelogNotConfiguredError) {
        return res
          .status(StatusCodes.UNPROCESSABLE_ENTITY)
          .json({ message: error.message })
      }

      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message })
    })
}

export const validateApproveDigest = celebrate({
  [Segments.QUERY]: Joi.object({
    digestId: Joi.string().hex().length(24).required(),
  }),
})

/**
 * Approves a drafted digest and emails it to the single configured address.
 *
 * Separate from generation on purpose. A digest that only exists as mail cannot
 * be looked at before it is sent, cannot survive a mail failure, and cannot be
 * approved by anyone — which is where this is heading.
 *
 * @route POST /cron/approve-digest?digestId=...
 * @returns 200 with the sent digest
 * @returns 401 if the shared secret is missing or wrong
 * @returns 404 if no digest has that id
 * @returns 409 if the digest is not a draft — already sent, held, or superseded
 * @returns 422 if the digest is not configured
 * @returns 500 if sending failed
 */
export const handleApproveDigest: ControllerHandler<
  never,
  DigestView | ErrorDto,
  never,
  { digestId: string }
> = (req, res) => {
  const { digestId } = req.query

  return approveDigest(digestId)
    .map((digest) => res.status(StatusCodes.OK).json(toView(digest)))
    .mapErr((error) => {
      logger.error({
        message: 'Failed to approve digest',
        meta: {
          action: 'handleApproveDigest',
          digestId,
          ...createReqMeta(req),
        },
        error,
      })

      if (error instanceof ChangelogDigestNotFoundError) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: error.message })
      }

      if (error instanceof ChangelogDigestNotApprovableError) {
        // Conflict rather than bad request: the id is fine, the digest is just
        // not in a state where approving it means anything.
        return res.status(StatusCodes.CONFLICT).json({ message: error.message })
      }

      if (error instanceof ChangelogNotConfiguredError) {
        return res
          .status(StatusCodes.UNPROCESSABLE_ENTITY)
          .json({ message: error.message })
      }

      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message })
    })
}

export const validateListDigests = celebrate({
  [Segments.QUERY]: Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(DEFAULT_LIST_LIMIT),
  }),
})

/**
 * Recent digests, newest first.
 *
 * Exists because approving needs an id, and the run that produced it was a
 * scheduled job nobody watched.
 *
 * @route GET /cron/digests?limit=10
 * @returns 200 with the digests
 * @returns 401 if the shared secret is missing or wrong
 * @returns 500 if the read failed
 */
export const handleListDigests: ControllerHandler<
  never,
  { digests: DigestView[] } | ErrorDto,
  never,
  // Optional despite celebrate supplying a default, because express types the
  // query as possibly-absent and a required field here does not typecheck at
  // the router.
  { limit?: number }
> = (req, res) => {
  return listDigests(req.query.limit ?? DEFAULT_LIST_LIMIT)
    .map((digests) =>
      res.status(StatusCodes.OK).json({ digests: digests.map(toView) }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Failed to list digests',
        meta: { action: 'handleListDigests', ...createReqMeta(req) },
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message })
    })
}
