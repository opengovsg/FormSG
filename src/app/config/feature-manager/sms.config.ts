import { FeatureNames, RegisterableFeature } from './types'

const smsFeature: RegisterableFeature<FeatureNames.Sms> = {
  name: FeatureNames.Sms,
  schema: {
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
  },
}

export default smsFeature
