import { Router } from 'express'

import * as IntranetController from '../../../../modules/intranet/intranet.controller'

export const IntranetRouter = Router()

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/intranet/is-intranet-check
 * @return 200 with boolean indicating whether the given IP address is an intranet IP
 */
IntranetRouter.get(
  '/is-intranet-check',
  IntranetController.handleGetIsIntranetCheck,
)

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/intranet/is-intranet-check
 * @return 200 with boolean indicating whether the given IP address is an intranet IP
 */
IntranetRouter.get('/is-ogp-check', IntranetController.handleGetIsOgpCheck)

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/intranet/is-proxy-check
 * @return 200 with boolean indicating whether the given IP address is a proxy IP
 */
IntranetRouter.get('/is-proxy-check', IntranetController.handleGetIsProxyCheck)
