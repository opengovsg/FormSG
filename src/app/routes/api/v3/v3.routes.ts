import { Router } from 'express'

import { AdminRouter } from './admin'
import { UserRouter } from './user'

export const V3Router = Router()

V3Router.use('/admin', AdminRouter)
V3Router.use('/user', UserRouter)
