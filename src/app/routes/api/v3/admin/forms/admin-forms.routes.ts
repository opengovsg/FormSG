import { Router } from 'express'

import { withUserAuthentication } from '../../../../../modules/auth/auth.middlewares'

import { AdminFormsBuildRouter } from './admin-forms.build.routes'
import { AdminFormsFeedbackRouter } from './admin-forms.feedback.routes'
import { AdminFormsSettingsRouter } from './admin-forms.settings.routes'
import { AdminFormsSubmissionsRouter } from './admin-forms.submissions.routes'

export const AdminFormsRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsRouter.use(withUserAuthentication)

AdminFormsRouter.use(AdminFormsBuildRouter)
AdminFormsRouter.use(AdminFormsSettingsRouter)
AdminFormsRouter.use(AdminFormsFeedbackRouter)
AdminFormsRouter.use(AdminFormsSubmissionsRouter)
