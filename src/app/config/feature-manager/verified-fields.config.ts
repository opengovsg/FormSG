import { FeatureNames, RegisterableFeature } from './types'

const verifiedFieldsFeature: RegisterableFeature<FeatureNames.VerifiedFields> = {
  name: FeatureNames.VerifiedFields,
  schema: {
    verificationSecretKey: {
      doc: 'The secret key for signing verified responses (email, mobile)',
      format: String,
      default: null,
      env: 'VERIFICATION_SECRET_KEY',
    },
  },
}

export default verifiedFieldsFeature
