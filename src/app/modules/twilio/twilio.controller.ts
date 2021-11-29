import { StatusCodes } from 'http-status-codes'
import Twilio from 'twilio'

import { ITwilioSmsWebhookBody } from 'src/types/twilio'

import { ControllerHandler } from '../core/core.types'

import { logFailedSmsDelivery } from './twilio.service'

const smsDeliveryFailedStatus = ['undelivered', 'failed']

/**
 * Middleware which validates that a request came from Twilio Webhook
 */
const validateTwilioWebhook = Twilio.webhook()

/**
 * Process the Webhook requests if they are failed or unsuccessful, ignoring the rest
 *
 * @param req Express request object
 * @param res - Express response object
 */
export const twilioSmsUpdates: ControllerHandler<
  unknown,
  never,
  ITwilioSmsWebhookBody
> = async (req, res) => {
  if (smsDeliveryFailedStatus.includes(req.body.MessageStatus))
    logFailedSmsDelivery(req.body)
  res.sendStatus(StatusCodes.OK)
}

export const handleTwilioSmsUpdates = [validateTwilioWebhook, twilioSmsUpdates]
