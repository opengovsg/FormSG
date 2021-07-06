import convict, { Schema } from 'convict'

export interface ISms {
  twilioAccountSid: string
  twilioApiKey: string
  twilioApiSecret: string
  twilioMsgSrvcSid: string
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
}

export const smsConfig = convict(smsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
