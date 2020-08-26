import { Joi, Segments } from 'celebrate'

export const forCheckUser = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email'),
  }),
}

export const forSendOtp = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email'),
  }),
}

export const forVerifyOtp = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email'),
    otp: Joi.string()
      .required()
      .regex(/^\d{6}$/)
      .message('Please enter a valid otp'),
  }),
}
