import { Router } from 'express'

import { AdminFormsFeedbackRouter } from './admin-forms.feedback.routes'
import { AdminFormsSettingsRouter } from './admin-forms.settings.routes'

export const AdminFormsRouter = Router()

AdminFormsRouter.use(AdminFormsSettingsRouter)
AdminFormsRouter.use(AdminFormsFeedbackRouter)
