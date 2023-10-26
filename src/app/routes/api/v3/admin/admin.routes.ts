import { Router } from 'express'

import { AdminFormsRouter } from './forms'

export const AdminRouter = Router()

AdminRouter.use('/forms', AdminFormsRouter)
