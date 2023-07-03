import { celebrate, Joi, Segments } from 'celebrate'

export const validateCaptchaParams = celebrate({
  [Segments.QUERY]: Joi.object({
    captchaResponse: Joi.string().allow(null).required(),
    captchaType: Joi.string().allow('').required(),
  }),
})
