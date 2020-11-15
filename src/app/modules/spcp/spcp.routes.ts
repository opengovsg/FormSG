import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { AuthType } from '../../../types'

import * as SpcpController from './spcp.controller'
// Shared routes for Singpass and Corppass
export const SpcpRouter = Router()

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
