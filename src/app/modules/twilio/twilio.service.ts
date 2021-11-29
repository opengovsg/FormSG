import { ITwilioSmsWebhookBody } from 'src/types/twilio'

import { createLoggerWithLabel } from '../../config/logger'

const logger = createLoggerWithLabel(module)

/**
 *
 * @param body body from Twilio Webhook with the failed sms details
 */
export const logFailedSmsDelivery = (body: ITwilioSmsWebhookBody): void => {
  const { To, MessageSid, MessageStatus, ErrorCode, ErrorMessage } = body

  logger.error({
    message: 'Error occurred when attempting to send SMS on twillio',
    meta: {
      action: 'sendingTwilioSmsFailed',
      To,
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
    },
  })
}
