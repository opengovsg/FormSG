import { Router } from 'express'

import { AdminRouter } from './admin'
import { AnalyticsRouter } from './analytics'
import { AuthRouter } from './auth'
import { BillingRouter } from './billing'
import { BounceRouter } from './bounce'
import { UserRouter } from './user'

export const V3Router = Router()

V3Router.use('/admin', AdminRouter)
V3Router.use('/user', UserRouter)
V3Router.use('/auth', AuthRouter)
V3Router.use('/notifications/bounce/email', BounceRouter)
V3Router.use('/billings', BillingRouter)
V3Router.use('/analytics', AnalyticsRouter)
