import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'

import { changelogDigestConfig } from '../../../../config/features/changelog-digest.config'
import { withCronChangelogSecretAuthentication } from '../../../../modules/auth/auth.middlewares'
import {
  handleApproveDigest,
  handleGenerateDigest,
  handleListDigests,
  validateApproveDigest,
  validateListDigests,
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
 * The digest job can send mail, so the routes exist only where the digest has
 * been deliberately configured — which is to say, where its shared secret is
 * set. Everywhere else they are not merely refused but absent.
 *
 * This replaced a development-only guard, which could not survive the job being
 * scheduled: a Lambda calling a deployed environment would have got a 404
 * forever. Keying on configuration rather than on NODE_ENV keeps the same
 * property that mattered — an environment nobody has set up for the digest does
 * not expose it — while allowing the environments that have been set up to run
 * it.
 *
 * The guard lives on the router rather than at the mount site so it travels
 * with the routes, and returns 404 rather than 403 so the endpoint's existence
 * is not advertised. It pairs with two other constraints: the secret
 * authenticates nobody when unset, and the digest is only ever sent to the
 * single configured address.
 */
const configuredOnly: ControllerHandler = (_req, res, next) => {
  if (changelogDigestConfig.apiSecret) return next()
  return res.status(StatusCodes.NOT_FOUND).json({ message: 'Not found' })
}

CronRouter.use(configuredOnly)

/**
 * Drafts this week's digest and persists it. Sends nothing.
 *
 * Idempotent within an ISO week: a second call returns the first one's digest
 * untouched, so the Monday schedule and a person running it by hand cannot
 * produce two digests for the same week.
 *
 * @protected
 * @route POST /cron/generate-digest
 */
CronRouter.post(
  '/generate-digest',
  withCronChangelogSecretAuthentication,
  handleGenerateDigest,
)

/**
 * Approves a drafted digest and emails it. The only route that sends mail.
 *
 * Split from generation so a digest can be read before it goes anywhere, can
 * survive a mail failure without losing the drafting work, and can later be
 * approved by someone other than the process that drafted it.
 *
 * @protected
 * @route POST /cron/approve-digest?digestId=...
 */
CronRouter.post(
  '/approve-digest',
  withCronChangelogSecretAuthentication,
  validateApproveDigest,
  handleApproveDigest,
)

/**
 * Recent digests, newest first. Approving needs an id, and the run that
 * produced it was a scheduled job nobody watched.
 *
 * @protected
 * @route GET /cron/digests?limit=10
 */
CronRouter.get(
  '/digests',
  withCronChangelogSecretAuthentication,
  validateListDigests,
  handleListDigests,
)
