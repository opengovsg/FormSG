import { Router } from 'express'

import { withCronScheduledClosureSecretAuthentication } from '../../../../modules/auth/auth.middlewares'
import * as ScheduledClosureController from '../../../../modules/form/scheduled-closure/scheduled-closure.controller'

/**
 * Routes driven by scheduled jobs rather than by users. They sit outside
 * /admin, whose router applies `withUserAuthentication` to everything beneath
 * it: a cron caller has no user session, only a shared secret.
 */
export const CronRouter = Router()

CronRouter.use(withCronScheduledClosureSecretAuthentication)

/**
 * Closes all public forms whose scheduled expiry has passed.
 * @protected
 * @route POST /cron/close-expired-forms
 *
 * @returns 200 with a report of which forms were closed
 * @returns 401 if the shared secret is missing or wrong
 * @returns 500 if the sweep failed
 */
CronRouter.post(
  '/close-expired-forms',
  ScheduledClosureController.handleCloseExpiredForms,
)
