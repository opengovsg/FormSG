import { StatusCodes } from 'http-status-codes'
import Twilio from 'twilio'

import { ITwilioSmsWebhookBody } from 'src/types/twilio'

import { isDev } from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'

const logger = createLoggerWithLabel(module)

/**
 * Middleware which validates that a request came from Twilio Webhook
 */
const validateTwilioWebhook = Twilio.webhook({ validate: !isDev })

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
  /**
   * Currently, it seems like the status are provided as string values, theres
   * no other documentation stating the properties and values in the Node SDK
   *
   * Example: https://www.twilio.com/docs/usage/webhooks/sms-webhooks.
   */

  if (req.body.ErrorCode || req.body.ErrorMessage) {
    logger.error({
      message: 'Error occurred when attempting to send SMS on twillio',
      meta: {
        action: 'twilioSmsUpdates',
        body: req.body,
      },
    })
  } else {
    logger.info({
      message: 'Sms Delivery update',
      meta: {
        action: 'twilioSmsUpdates',
        body: req.body,
      },
    })
  }

  return res.sendStatus(StatusCodes.OK)
}

export const handleTwilioSmsUpdates = [validateTwilioWebhook, twilioSmsUpdates]
