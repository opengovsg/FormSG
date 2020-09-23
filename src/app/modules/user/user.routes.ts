import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as UserController from './user.controller'

const UserRouter = Router()

UserRouter.get('/', UserController.handleFetchUser)

// /contact subroute
UserRouter.post(
  '/contact/sendotp',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      contact: Joi.string().required(),
      userId: Joi.string().required(),
    }),
  }),
  UserController.handleContactSendOtp,
)

UserRouter.post(
  '/contact/verifyotp',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      userId: Joi.string().required(),
      otp: Joi.string().length(6).required(),
      contact: Joi.string().required(),
    }),
  }),
  UserController.handleContactVerifyOtp,
)

export default UserRouter
