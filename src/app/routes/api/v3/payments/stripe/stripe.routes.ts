import { Router } from 'express'

export const StripeRouter = Router()

StripeRouter.get('/')

StripeRouter.post('/webhook')
