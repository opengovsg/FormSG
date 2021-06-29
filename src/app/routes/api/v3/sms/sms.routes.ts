import { Router } from 'express'

import * as SmsController from '../../../../services/sms/sms.controller'

export const SmsRouter = Router()

SmsRouter.route('/:userId([a-fA-F0-9]{24})/:formId([a-fA-F0-9]{24})').get(
  SmsController.handleGetFreeSmsCountForUser,
)
