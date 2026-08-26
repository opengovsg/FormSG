import { celebrate, Joi, Segments } from 'celebrate'
import { ErrorDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import { ChangelogNotConfiguredError } from './changelog.errors'
import { defaultWindow, generateAndPreviewDigest } from './changelog.service'
import { DigestDraft } from './changelog.types'

const logger = createLoggerWithLabel(module)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const validateGenerateDigest = celebrate({
  [Segments.BODY]: Joi.object({
    since: Joi.string().regex(ISO_DATE),
    until: Joi.string().regex(ISO_DATE),
  })
    // Both or neither. A half-specified window silently pairing with a default
    // is the kind of thing that produces a digest covering the wrong fortnight.
    .and('since', 'until'),
})

type GenerateDigestBody = { since?: string; until?: string }

type GenerateDigestResponse =
  | {
      itemCount: number
      consideredPullRequests: number
      window: DigestDraft['window']
      items: DigestDraft['items']
    }
  | ErrorDto

/**
 * Runs one digest cycle and emails the result to the configured preview
 * address.
 *
 * The response body is the draft rather than a bare acknowledgement, so a local
 * run can be inspected without opening maildev.
 *
 * @route POST /api/v3/cron/generate-digest
 * @returns 200 with the drafted digest, which may legitimately contain no items
 * @returns 401 if the shared secret is missing or wrong
 * @returns 422 if the digest is not configured
 * @returns 500 if the cycle failed
 */
export const handleGenerateDigest: ControllerHandler<
  never,
  GenerateDigestResponse,
  GenerateDigestBody
> = (req, res) => {
  const window =
    req.body.since && req.body.until
      ? { since: req.body.since, until: req.body.until }
      : defaultWindow(new Date())

  return generateAndPreviewDigest(window)
    .map((draft) =>
      res.status(StatusCodes.OK).json({
        itemCount: draft.items.length,
        consideredPullRequests: draft.consideredPullRequests,
        window: draft.window,
        items: draft.items,
      }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Failed to generate digest',
        meta: {
          action: 'handleGenerateDigest',
          window,
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
