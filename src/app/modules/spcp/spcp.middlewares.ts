import { celebrate, Joi, Segments } from 'celebrate'

export const spcpOidcLoginParamsMiddleware = celebrate({
  [Segments.QUERY]: Joi.object({
    state: Joi.string().required(),
    code: Joi.string().required(),
  }),
})
