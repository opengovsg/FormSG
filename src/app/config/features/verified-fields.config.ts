import convict, { Schema } from 'convict'

export interface IVerifiedFields {
  verificationSecretKey: string
}

const verifiedFieldsSchema: Schema<IVerifiedFields> = {
  verificationSecretKey: {
    doc: 'The secret key for signing verified responses (email, mobile)',
    format: String,
    default: null,
    env: 'VERIFICATION_SECRET_KEY',
  },
}

export const verifiedFieldsConfig = convict(verifiedFieldsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
