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

/**
 * The manual override takes calendar dates, which is what a person reproducing
 * a particular week actually has to hand. They are widened to instants below,
 * since the window itself is expressed at instant precision.
 *
 * `Joi.date().iso()` rather than a shape regex: a regex accepts 2026-13-99,
 * which would reach GitHub as a query matching nothing and read as a digest
 * with nothing to report rather than as the bad input it is. `raw()` keeps the
 * string, so the handler is not handed a Date in a local timezone.
 */
export const validateGenerateDigest = celebrate({
  [Segments.BODY]: Joi.object({
    since: Joi.date().iso().raw(),
    until: Joi.date().iso().raw().min(Joi.ref('since')),
  })
    // Both or neither. A half-specified window silently pairing with a default
    // is the kind of thing that produces a digest covering the wrong week.
    .and('since', 'until'),
})

/**
 * Widens a calendar date into the instant bound it stands for. A window given
 * as 2026-08-17..2026-08-24 means "from the start of the 17th to the end of the
 * 24th", which is what someone naming two dates intends.
 *
 * `since` is exclusive, so the start of the day is the instant just before it —
 * expressed as the end of the previous day would be fiddlier and no clearer;
 * subtracting a millisecond keeps the whole of the named day inside the window.
 */
const startBoundary = (date: string): string =>
  new Date(new Date(`${date}T00:00:00.000Z`).getTime() - 1).toISOString()

const endBoundary = (date: string): string =>
  new Date(`${date}T23:59:59.999Z`).toISOString()

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
          since: startBoundary(req.body.since),
          until: endBoundary(req.body.until),
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
