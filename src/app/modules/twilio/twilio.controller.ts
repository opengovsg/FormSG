import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import { ITwilioSmsWebhookBody, TwilioSmsStatsdTags } from 'src/types/twilio'

import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'

import { twilioStatsdClient } from './twilio.statsd-client'

const logger = createLoggerWithLabel(module)

/**
 * Middleware which validates that a request came from Twilio Webhook
 * by checking the presence of X-Twilio-Sgnature in request header and
 * sms delivery status request body parameters
 */
const validateTwilioWebhook = celebrate({
  [Segments.HEADERS]: Joi.object({
    'x-twilio-signature': Joi.string().required(),
  }).unknown(),
  [Segments.BODY]: Joi.object()
    .keys({
      SmsSid: Joi.string().required(),
      SmsStatus: Joi.string().required(),
      MessageStatus: Joi.string().required(),
      To: Joi.string().required(),
      MessageSid: Joi.string().required(),
      MessagingServiceSid: Joi.string().required(),
      AccountSid: Joi.string().required(),
      From: Joi.string().required(),
      ApiVersion: Joi.string().required(),
      ErrorCode: Joi.number(), //Unable to find any official documentation stating the ErrorCode type but should be a number
      ErrorMessage: Joi.string(),
    })
    .unknown(),
})

/**
 * Logs all incoming Webhook requests from Twilio in AWS
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

  // Extract public sender's ip address which was passed to twilio as a query param in the status callback
  let senderIp = null
  try {
    const url = new URL(
      req.protocol + '://' + req.get('host') + req.originalUrl,
    )
    senderIp = url.searchParams.get('senderIp')
  } catch {
    logger.error({
      message: 'Error occurred when extracting senderIp',
      meta: {
        action: 'twilioSmsUpdates',
        body: req.body,
        originalUrl: req.originalUrl,
      },
    })
  }

  const ddTags: TwilioSmsStatsdTags = {
    // msgSrvcSid not included to limit tag cardinality (for now?)
    smsstatus: req.body.SmsStatus,
    errorcode: '0',
  }

  if (req.body.ErrorCode || req.body.ErrorMessage) {
    if (req.body.ErrorCode) {
      ddTags.errorcode = `${req.body.ErrorCode}`
    }

    logger.error({
      message: 'Error occurred when attempting to send SMS on twillio',
      meta: {
        action: 'twilioSmsUpdates',
        body: req.body,
        senderIp,
      },
    })
  } else {
    logger.info({
      message: 'Sms Delivery update',
      meta: {
        action: 'twilioSmsUpdates',
        body: req.body,
        senderIp,
      },
    })
  }

  twilioStatsdClient.increment('sms.update', 1, 1, ddTags)

  return res.sendStatus(StatusCodes.OK)
}

export const handleTwilioSmsUpdates = [validateTwilioWebhook, twilioSmsUpdates]
