import { Router } from 'express'

import { AdminRouter } from './admin'

export const V1PublicRouter = Router()

V1PublicRouter.use('/admin', AdminRouter)
