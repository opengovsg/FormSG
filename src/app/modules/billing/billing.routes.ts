import { Router } from 'express'

import { withUserAuthentication } from '../auth/auth.middlewares'

import * as BillingController from './billing.controller'

export const BillingRouter = Router()

// All routes in this router are protected.
BillingRouter.use(withUserAuthentication)

/**
 * Lists the SingPass/CorpPass (SPCP) logins made to forms
 * created by the user's agency, serving as the basis for billing
 * @security session
 * @route GET /billing
 * @param query.esrvcId the esrvcId to retrieve SingPass login stats for
 * @param query.yr the year to query
 * @param query.mth the month of the given year to query
 * @return 200 with an array of SPCP logins made to forms owned by the user's agency, ie, what the user's agency will be billed for
 * @return 401 when request does not contain a user session
 * @return 500 when error occurs whilst querying database
 */
BillingRouter.get('/', BillingController.handleGetBillInfo)
