import { Router } from 'express'

import { AdminFormsPublicRouter } from './forms'

export const AdminRouter = Router()

AdminRouter.use('/forms', AdminFormsPublicRouter)
