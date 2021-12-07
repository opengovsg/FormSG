import { Router } from 'express'

import { handleTwilioSmsUpdates } from '../../../../modules/twilio/twilio.controller'

import { BouncesRouter } from './bounces'

export const NotificationsRouter = Router()

NotificationsRouter.use('/bounces', BouncesRouter)

/**
<<<<<<< HEAD
 * Receives SMS delivery status updates from Twilio webhook
 *
 * Logs any errors or failures in SMS delivery while ignoring succesful
 * status updates
=======
 * Receives and logs all SMS delivery status updates from Twilio webhook
>>>>>>> 8c7752b56a8e035e02cdc08e2637d22656f855e5
 *
 * Path here is required to be synced with statusCallbackRoute under
 * sms.service#sendSms
 *
 * @route POST /api/v3/notifications/twilio
 *
 * @returns 200 when message succesfully received and logged
<<<<<<< HEAD
 * @returns 400 when request is not coming from Twilio
 * @returns 403 when twilio request validation failed
=======
 * @returns 400 when request is not coming from Twilio or request body s invalid
>>>>>>> 8c7752b56a8e035e02cdc08e2637d22656f855e5
 */
NotificationsRouter.post('/twilio', handleTwilioSmsUpdates)
