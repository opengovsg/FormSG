import { Router } from 'express'

import { AdminRouter } from './admin'

export const V1PlatformRouter = Router()

V1PlatformRouter.use('/admin', AdminRouter)
