import { Router } from 'express'

import { AdminFormsExternalRouter } from './forms'

export const AdminRouter = Router()

AdminRouter.use('/forms', AdminFormsExternalRouter)
