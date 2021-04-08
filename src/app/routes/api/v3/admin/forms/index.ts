import { Router } from 'express'

import { AdminFormsSettingsRouter } from './admin-forms.settings.routes'

export const AdminFormsRouter = Router()

AdminFormsRouter.use(AdminFormsSettingsRouter)
