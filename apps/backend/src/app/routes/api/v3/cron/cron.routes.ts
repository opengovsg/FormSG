import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'

import config from '../../../../config/config'
import { withCronChangelogSecretAuthentication } from '../../../../modules/auth/auth.middlewares'
import {
  handleGenerateDigest,
  validateGenerateDigest,
} from '../../../../modules/changelog/changelog.controller'
import { ControllerHandler } from '../../../../modules/core/core.types'

/**
 * Routes driven by scheduled jobs rather than by users. Not REST style, more
 * like RPC: each route is one job's entire unit of work.
 *
 * These sit outside /admin, whose router applies withUserAuthentication to
 * everything beneath it. A scheduled caller has no user session and
 * authenticates with a shared secret instead.
 */
export const CronRouter = Router()

/**
 * The digest job can send mail, so while it is still a prototype it is
 * unreachable outside development. The guard lives on the router rather than at
 * the mount site so it travels with the routes, and returns 404 rather than 403
 * so the endpoint's existence is not advertised.
 */
const devOnly: ControllerHandler = (_req, res, next) => {
  if (config.isDev) return next()
  return res.status(StatusCodes.NOT_FOUND).json({ message: 'Not found' })
}

CronRouter.use(devOnly)

/**
 * Generates the weekly product digest and emails it to the configured preview
 * address. Defaults to everything merged since the last digest was sent.
 *
 * @protected
 * @route POST /cron/generate-digest
 */
CronRouter.post(
  '/generate-digest',
  withCronChangelogSecretAuthentication,
  validateGenerateDigest,
  handleGenerateDigest,
)
