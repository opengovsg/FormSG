import { Router } from 'express'

import { AdminRouter } from './admin'
import { AnalyticsRouter } from './analytics'
import { AuthRouter } from './auth'
import { BillingsRouter } from './billings'
import { ClientRouter } from './client'
import { PublicFormsRouter } from './forms'
import { NotificationsRouter } from './notifications'
import { SingpassOidcRouter } from './singpass'
import { UserRouter } from './user'

export const V3Router = Router()

V3Router.use('/admin', AdminRouter)
V3Router.use('/user', UserRouter)
V3Router.use('/auth', AuthRouter)
V3Router.use('/client', ClientRouter)
V3Router.use('/notifications', NotificationsRouter)
V3Router.use('/billings', BillingsRouter)
V3Router.use('/analytics', AnalyticsRouter)
V3Router.use('/forms', PublicFormsRouter)
V3Router.use('/singpass', SingpassOidcRouter)
