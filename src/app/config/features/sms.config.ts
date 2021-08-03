import convict, { Schema } from 'convict'

export interface ISms {
  twilioAccountSid: string
  twilioApiKey: string
  twilioApiSecret: string
  twilioMsgSrvcSid: string
  smsVerificationLimit: number
}

const smsSchema: Schema<ISms> = {
  twilioAccountSid: {
    doc: 'Twilio messaging ID',
    format: String,
    default: null,
    env: 'TWILIO_ACCOUNT_SID',
  },
  twilioApiKey: {
    doc: 'Twilio standard API Key',
    format: String,
    default: null,
    env: 'TWILIO_API_KEY',
  },
  twilioApiSecret: {
    doc: 'Twilio API Secret',
    format: String,
    default: null,
    env: 'TWILIO_API_SECRET',
  },
  twilioMsgSrvcSid: {
    doc: 'Messaging service ID',
    format: String,
    default: null,
    env: 'TWILIO_MESSAGING_SERVICE_SID',
  },
  smsVerificationLimit: {
    doc: 'Sms verification limit for an admin',
    // Positive int
    format: 'nat',
    default: 10000,
    env: 'SMS_VERIFICATION_LIMIT',
  },
}

export const smsConfig = convict(smsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
