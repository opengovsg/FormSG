import { celebrate } from 'celebrate'
import { Router } from 'express'

import * as UserController from './user.controller'
import * as UserRules from './user.rules'

const UserRouter = Router()

UserRouter.post(
  '/contact/sendotp',
  celebrate(UserRules.forContactSendOtp),
  UserController.handleContactSendOtp,
)

UserRouter.post(
  '/contact/verifyotp',
  celebrate(UserRules.forContactVerifyOtp),
  UserController.handleContactVerifyOtp,
)

export default UserRouter
