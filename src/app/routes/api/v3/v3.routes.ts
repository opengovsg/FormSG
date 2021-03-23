import { Router } from 'express'

import { AdminRouter } from './admin'

export const V3Router = Router()

V3Router.use('/admin', AdminRouter)
