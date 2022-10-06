import { celebrate, Joi, Segments } from 'celebrate'

export const loginParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    SAMLart: Joi.string().required(),
    RelayState: Joi.string().required(),
  }),
})

export const spcpOidcLoginParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    state: Joi.string().required(),
    code: Joi.string().required(),
  }),
})
