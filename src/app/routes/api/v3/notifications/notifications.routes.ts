import { Router } from 'express'

import { handleStripeEventUpdates } from '../../../../modules/payments/stripe.events.controller'

import { BouncesRouter } from './bounces'

export const NotificationsRouter = Router()

NotificationsRouter.use('/bounces', BouncesRouter)

/**
 * Receives and logs all payment updates from Stripe webhook
 *
 * @route POST /api/v3/notifications/stripe
 *
 * @returns 200 when message succesfully received and logged
 * @returns 400 when request is not coming from Stripe or request body s invalid
 */
NotificationsRouter.post('/stripe', handleStripeEventUpdates)
