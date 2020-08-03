import { FeatureNames, RegisterableFeature } from './types'

const webhookVerifiedContentFeature: RegisterableFeature<FeatureNames.WebhookVerifiedContent> = {
  name: FeatureNames.WebhookVerifiedContent,
  schema: {
    signingSecretKey: {
      doc:
        'The secret key for signing verified content passed into the database and for signing webhooks',
      format: String,
      default: null,
      env: 'SIGNING_SECRET_KEY',
    },
  },
}

export default webhookVerifiedContentFeature
