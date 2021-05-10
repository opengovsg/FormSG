import { Router } from 'express'

import * as VerificationController from '../../../../modules/verification/verification.controller'

export const PublicFormsVerificationRouter = Router()

PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications',
).post(VerificationController.handleCreateTransactionWithFieldId)
