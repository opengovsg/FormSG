// Based off Twilio documentation - https://www.twilio.com/docs/usage/webhooks/sms-webhooks
export interface ITwilioSmsWebhookBody {
  SmsSid: string
  SmsStatus: string
  MessageStatus: string
  To: string
  MessageSid: string
  AccountSid: string
  MessagingServiceSid: string
  From: string
  ApiVersion: string
  ErrorCode?: number // Only filled when it is 'failed' or 'undelivered'
  ErrorMessage?: string // Only filled when it is 'failed' or 'undelivered'
}

export type TwilioSmsStatsdTags = {
  errorcode: string
  smsstatus: string
}
