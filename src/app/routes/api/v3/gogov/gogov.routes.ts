import { Router } from 'express'

import * as GoGovController from '../../../../modules/gogov/gogov.controller'

export const GoGovRouter = Router()

/**
 * Checks if the payment receipt is ready
 * @route GET /gogov/:linkSuffix
 *
 * @returns 200 if link suffix is taken
 * @returns 404 if link suffix has not been taken
 */
GoGovRouter.route('/check/:linkSuffix([a-z0-9-]+)').get(
  GoGovController.getGoLinkAvailability,
)

/**
 * Checks if the payment receipt is ready
 * @route GET /gogov/:linkSuffix
 *
 * @returns 200 if link suffix is taken
 * @returns 404 if link suffix has not been taken
 */
GoGovRouter.route('/claim').post(GoGovController.claimGoLink)
