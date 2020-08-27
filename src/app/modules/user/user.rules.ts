import { Joi, Segments } from 'celebrate'

export const forContactSendOtp = {
  [Segments.BODY]: Joi.object().keys({
    contact: Joi.string().required(),
    userId: Joi.string().required(),
  }),
}

export const forContactVerifyOtp = {
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.string().required(),
    otp: Joi.string().length(6).required(),
    contact: Joi.string().required(),
  }),
}
