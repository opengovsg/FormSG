import { Router } from 'express'

import { AdminFormRouter } from './form/admin-form.routes'

export const AdminRouter = Router()

AdminRouter.use('/form', AdminFormRouter)
