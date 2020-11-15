import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { AuthType } from '../../../types'

import * as SpcpController from './spcp.controller'
// Shared routes for Singpass and Corppass
export const SpcpRouter = Router()

/**
 * Provide a URL that web agents are obliged to redirect users to.
 * Due to cross-origin restrictions in place by SingPass/CorpPass,
 * this endpoint cannot and should not issue a 302 redirect
 * @route GET /spcp/redirect
 * @group SPCP - SingPass/CorpPass logins for form-fillers
 * @param target.query.required - the destination URL after login
 * @param authType.query.required - `SP` for SingPass or `CP` for CorpPass
 * @param esrvcId.query.required - e-service id
 * @produces application/json
 * @returns 200 - contains the URL to redirect to
 * @returns 400 - the redirect URL will be malformed due to missing parameters
 * @returns 500 - an error occurred while creating the URL
 */
SpcpRouter.get(
  '/redirect',
  celebrate({
    [Segments.QUERY]: Joi.object({
      target: Joi.string().required(),
      authType: Joi.string().required().valid(AuthType.SP, AuthType.CP),
      esrvcId: Joi.string().required(),
    }),
  }),
  SpcpController.handleRedirect,
)
