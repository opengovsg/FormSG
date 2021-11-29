import { Router } from 'express'

import { handleTwilioSmsUpdates } from '../../../../modules/twilio/twilio.controller'

import { BouncesRouter } from './bounces'

export const NotificationsRouter = Router()

NotificationsRouter.use('/bounces', BouncesRouter)

/**
 * Receives SMS delivery status updates from Twilio webhook
 *
 * Logs any errors or failures in SMS delivery while ignoring succesful
 * status updates
 *
 * @route POST /api/v3/notifications/twilio
 */
NotificationsRouter.post('/twilio', handleTwilioSmsUpdates)
