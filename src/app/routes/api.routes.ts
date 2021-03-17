import { Router } from 'express'

import { ADMIN_NESTED_ROUTE, AdminRouter } from './admin'

export const API_V3_ROOT_ROUTE = '/api/v3'

export const ApiRouter = Router()

ApiRouter.use(ADMIN_NESTED_ROUTE, AdminRouter)
