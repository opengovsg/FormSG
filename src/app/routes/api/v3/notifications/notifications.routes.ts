import { Router } from 'express'

import { BounceRouter } from './bounce'

export const NotificationsRouter = Router()

NotificationsRouter.use('/bounce', BounceRouter)
