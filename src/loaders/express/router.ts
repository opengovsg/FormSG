import { Router } from 'express'

import { AdminRouter } from '../../app/modules/form/admin-form/admin-form.routes'

export const API_ROOT_ROUTE = '/api/v1'

export const ApiRouter = Router()

ApiRouter.use('/admin', AdminRouter)
