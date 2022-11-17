import { Router } from 'express'

import { StripeRouter } from './stripe'

export const PaymentsRouter = Router()

PaymentsRouter.use('/stripe', StripeRouter)
