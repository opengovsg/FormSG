import convict, { Schema } from 'convict'

export interface ISms {
  smsVerificationLimit: number
}

const smsSchema: Schema<ISms> = {
  smsVerificationLimit: {
    doc: 'Sms verification limit for form',
    // Positive int
    format: 'nat',
    default: 10000,
    env: 'SMS_VERIFICATION_LIMIT',
  },
}

export const smsConfig = convict(smsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
