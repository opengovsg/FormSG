import { Router } from 'express'

import { withUserAuthentication } from '../../../../modules/auth/auth.middlewares'

import { AdminFormsRouter } from './forms'

export const AdminRouter = Router()

// All routes in this handler should be protected by authentication.
AdminRouter.use(withUserAuthentication)

AdminRouter.use('/forms', AdminFormsRouter)
