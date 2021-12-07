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
 * Path here is required to be synced with statusCallbackRoute under
 * sms.service#sendSms
 *
 * @route POST /api/v3/notifications/twilio
 *
 * @returns 200 when message succesfully received and logged
 * @returns 400 when request is not coming from Twilio
 * @returns 403 when twilio request validation failed
 */
NotificationsRouter.post('/twilio', handleTwilioSmsUpdates)
