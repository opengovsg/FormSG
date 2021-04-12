import { Router } from 'express'

import { AdminRouter } from './admin'
import { AnalyticsRouter } from './analytics'
import { AuthRouter } from './auth'
import { BillingsRouter } from './billings'
import { NotificationsRouter } from './notifications'
import { UserRouter } from './user'

export const V3Router = Router()

V3Router.use('/admin', AdminRouter)
V3Router.use('/user', UserRouter)
V3Router.use('/auth', AuthRouter)
V3Router.use('/notifications', NotificationsRouter)
V3Router.use('/billings', BillingsRouter)
V3Router.use('/analytics', AnalyticsRouter)
