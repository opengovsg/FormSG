import { Router } from 'express'

import { withUserAuthentication } from '../../../../../modules/auth/auth.middlewares'

import { AdminFormsFeedbackRouter } from './admin-forms.feedback.routes'
import { AdminFormsFormRouter } from './admin-forms.form.routes'
import { AdminFormsLogicRouter } from './admin-forms.logic.routes'
import { AdminFormsPresignRouter } from './admin-forms.presign.routes'
import { AdminFormsPreviewRouter } from './admin-forms.preview.routes'
import { AdminFormsSettingsRouter } from './admin-forms.settings.routes'
import { AdminFormsSubmissionsRouter } from './admin-forms.submissions.routes'

export const AdminFormsRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsRouter.use(withUserAuthentication)

AdminFormsRouter.use(AdminFormsSettingsRouter)
AdminFormsRouter.use(AdminFormsFeedbackRouter)
AdminFormsRouter.use(AdminFormsFormRouter)
AdminFormsRouter.use(AdminFormsSubmissionsRouter)
AdminFormsRouter.use(AdminFormsPreviewRouter)
AdminFormsRouter.use(AdminFormsPresignRouter)
AdminFormsRouter.use(AdminFormsLogicRouter)
