import { celebrate, Joi, Segments } from 'celebrate'

export const validateLoginRequest = celebrate({
  [Segments.QUERY]: Joi.object({
    code: Joi.string().required(),
    state: Joi.string().required(),
  }),
})
