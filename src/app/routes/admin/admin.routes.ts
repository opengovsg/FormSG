import { Router } from 'express'

import {
  ADMIN_FORM_NESTED_ROUTE,
  AdminFormRouter,
} from './form/admin-form.routes'

export const ADMIN_NESTED_ROUTE = '/admin'

export const AdminRouter = Router()

AdminRouter.use(ADMIN_FORM_NESTED_ROUTE, AdminFormRouter)
