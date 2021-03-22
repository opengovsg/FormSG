import { Router } from 'express'

import { AdminRouter } from './admin'

export const API_V3_ROOT_ROUTE = '/api/v3'

export const ApiRouter = Router()

ApiRouter.use('/admin', AdminRouter)
