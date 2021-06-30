import { Router } from 'express'

import * as SmsController from '../../../../services/sms/sms.controller'

export const SmsRouter = Router()

SmsRouter.route('/:formId([a-fA-F0-9]{24})').get(
  SmsController.handleGetFreeSmsCountForFormAdmin,
)
