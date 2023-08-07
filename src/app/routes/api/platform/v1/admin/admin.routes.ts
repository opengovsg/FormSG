import { Router } from 'express'

import { AdminFormsPlatformRouter } from './forms'

export const AdminRouter = Router()

AdminRouter.use('/forms', AdminFormsPlatformRouter)
