import { Router } from 'express'

import * as AdminPaymentsController from '../../../../../modules/form/admin-form/admin-form.payments.controller'

export const AdminFormsTwilioRouter = Router()

AdminFormsTwilioRouter.route('/:formId([a-fA-F0-9]{24})/stripe').post(
  AdminPaymentsController.handleConnectAccount,
)
