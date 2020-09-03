import { Router } from 'express'

import { handleSns } from './bounce.controller'

export const BounceRouter = Router()

/**
 * When email bounces, SNS calls this function to mark the
 * submission as having bounced.
 *
 * Note that if anything errors in between, just return a 200
 * to SNS, as the error code to them doesn't really matter.
 *
 * @route POST /emailnotifications
 */
BounceRouter.post('/', handleSns)
