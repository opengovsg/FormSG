import { celebrate, Joi, Segments } from 'celebrate'

import { AuthType } from 'src/types'

export const redirectParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    target: Joi.string().required(),
    authType: Joi.string().required().valid(AuthType.SP, AuthType.CP),
    esrvcId: Joi.string().required(),
  }),
})

export const loginParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    SAMLart: Joi.string().required(),
    RelayState: Joi.string().required(),
  }),
})
