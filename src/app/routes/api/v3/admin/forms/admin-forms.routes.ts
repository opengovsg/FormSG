import { Router } from 'express'

import {
  logAdminAction,
  withUserAuthentication,
} from '../../../../../modules/auth/auth.middlewares'

import { AdminFormsFeedbackRouter } from './admin-forms.feedback.routes'
import { AdminFormsFormRouter } from './admin-forms.form.routes'
import { AdminFormsGoGovRouter } from './admin-forms.gogov.routes'
import { AdminFormsLogicRouter } from './admin-forms.logic.routes'
import { AdminFormsPaymentsRouter } from './admin-forms.payments.routes'
import { AdminFormsPresignRouter } from './admin-forms.presign.routes'
import { AdminFormsPreviewRouter } from './admin-forms.preview.routes'
import { AdminFormsSettingsRouter } from './admin-forms.settings.routes'
import { AdminFormsSubmissionsRouter } from './admin-forms.submissions.routes'
import { AdminFormsTwilioRouter } from './admin-forms.twilio.routes'

export const AdminFormsRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsRouter.use(withUserAuthentication)

// Log all non-get admin form actions
AdminFormsRouter.use('/:formId([a-fA-F0-9]{24})', logAdminAction)

AdminFormsRouter.use(AdminFormsSettingsRouter)
AdminFormsRouter.use(AdminFormsFeedbackRouter)
AdminFormsRouter.use(AdminFormsFormRouter)
AdminFormsRouter.use(AdminFormsSubmissionsRouter)
AdminFormsRouter.use(AdminFormsPreviewRouter)
AdminFormsRouter.use(AdminFormsPresignRouter)
AdminFormsRouter.use(AdminFormsLogicRouter)
AdminFormsRouter.use(AdminFormsTwilioRouter)
AdminFormsRouter.use(AdminFormsPaymentsRouter)
AdminFormsRouter.use(AdminFormsGoGovRouter)
