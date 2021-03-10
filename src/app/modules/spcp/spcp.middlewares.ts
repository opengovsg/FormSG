import { celebrate, Joi, Segments } from 'celebrate'

import { AuthType } from '../../../types'

export const redirectParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    target: Joi.string().required(),
    // TODO (#1116): stop allowing AuthType.MyInfo
    authType: Joi.string()
      .required()
      .valid(AuthType.SP, AuthType.CP, AuthType.MyInfo),
    esrvcId: Joi.string().required(),
  }),
})

export const loginParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    SAMLart: Joi.string().required(),
    RelayState: Joi.string().required(),
  }),
})
