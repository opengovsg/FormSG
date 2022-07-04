import { celebrate, Joi, Segments } from 'celebrate'

import { FormAuthType } from '../../../../shared/types'

export const redirectParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    target: Joi.string().required(),
    authType: Joi.string().required().valid(FormAuthType.SP, FormAuthType.CP),
    esrvcId: Joi.string().required(),
  }),
})

export const loginParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    SAMLart: Joi.string().required(),
    RelayState: Joi.string().required(),
  }),
})

export const spOidcLoginParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    state: Joi.string().required(),
    code: Joi.string().required(),
  }),
})
