import { celebrate, Joi, Segments } from 'celebrate'

export const validateTurnstileParams = celebrate({
  [Segments.QUERY]: Joi.object({
    captchaResponse: Joi.string().allow(null).required(),
  }),
})
