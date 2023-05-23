import { Router } from 'express'

import { AdminRouter } from './admin'

export const V1ExternalRouter = Router()

V1ExternalRouter.use('/admin', AdminRouter)
