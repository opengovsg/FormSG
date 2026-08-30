import { celebrate, Joi, Segments } from 'celebrate'
import { ErrorDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { okAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import { ChangelogNotConfiguredError } from './changelog.errors'
import { generateAndPreviewDigest, nextDigestWindow } from './changelog.service'
import { DigestCycleResult, DigestWindow } from './changelog.types'

const logger = createLoggerWithLabel(module)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const validateGenerateDigest = celebrate({
  [Segments.BODY]: Joi.object({
    since: Joi.string().regex(ISO_DATE),
    until: Joi.string().regex(ISO_DATE),
  })
    // Both or neither. A half-specified window silently pairing with a default
    // is the kind of thing that produces a digest covering the wrong week.
    .and('since', 'until'),
})

type GenerateDigestBody = { since?: string; until?: string }

type GenerateDigestResponse =
  | {
      /** 'sent' or 'skipped'. Skipped is an ordinary outcome, not a failure. */
      outcome: DigestCycleResult['outcome']
      /** Notable changes found, before the top-three cut. */
      candidateCount: number
      consideredPullRequests: number
      window: DigestCycleResult['draft']['window']
      /** What was emailed. Empty when the cycle was skipped. */
      sentItems: DigestCycleResult['sentItems']
      /** Everything the generator found, ranked. Useful when skipped. */
      candidates: DigestCycleResult['draft']['items']
    }
  | ErrorDto

/**
 * Runs one digest cycle and emails the result to the configured preview
 * address.
 *
 * The window defaults to everything merged since the last digest was sent.
 * Passing `since` and `until` overrides that, which is how a local run
 * reproduces a particular week without waiting for one.
 *
 * The response body is the draft rather than a bare acknowledgement, so a run
 * can be inspected without opening maildev — including the candidates that were
 * held over when the cycle skipped.
 *
 * @route POST /api/v3/cron/generate-digest
 * @returns 200 whether the digest was sent or held over; `outcome` says which
 * @returns 401 if the shared secret is missing or wrong
 * @returns 422 if the digest is not configured
 * @returns 500 if the cycle failed
 */
export const handleGenerateDigest: ControllerHandler<
  never,
  GenerateDigestResponse,
  GenerateDigestBody
> = (req, res) => {
  const requestedWindow =
    req.body.since && req.body.until
      ? okAsync<DigestWindow, never>({
          since: req.body.since,
          until: req.body.until,
        })
      : nextDigestWindow(new Date())

  return requestedWindow
    .andThen(generateAndPreviewDigest)
    .map((result) =>
      res.status(StatusCodes.OK).json({
        outcome: result.outcome,
        candidateCount: result.candidateCount,
        consideredPullRequests: result.draft.consideredPullRequests,
        window: result.draft.window,
        sentItems: result.sentItems,
        candidates: result.draft.items,
      }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Failed to generate digest',
        meta: {
          action: 'handleGenerateDigest',
          ...createReqMeta(req),
        },
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
