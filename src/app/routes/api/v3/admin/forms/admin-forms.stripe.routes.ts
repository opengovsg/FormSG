import { Router } from 'express'

import * as AdminPaymentsController from '../../../../../modules/form/admin-form/admin-form.payments.controller'

export const AdminFormsPaymentsRouter = Router()

AdminFormsPaymentsRouter.route('/:formId([a-fA-F0-9]{24})/stripe').post(
  AdminPaymentsController.handleConnectAccount,
)

AdminFormsPaymentsRouter.route('/:formId([a-fA-F0-9]{24})/stripe/validate').get(
  AdminPaymentsController.handleValidatePaymentAccount,
)
