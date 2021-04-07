import { Router } from 'express'

import { AdminRouter } from './admin'
import { AuthRouter } from './auth'
import { ClientRouter } from './client'
import { UserRouter } from './user'

export const V3Router = Router()

V3Router.use('/admin', AdminRouter)
V3Router.use('/user', UserRouter)
V3Router.use('/auth', AuthRouter)
V3Router.use('/client', ClientRouter)
