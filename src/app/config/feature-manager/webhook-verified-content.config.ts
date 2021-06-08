import { FeatureNames, RegisterableFeature } from './types'

const webhookVerifiedContentFeature: RegisterableFeature<FeatureNames.WebhookVerifiedContent> =
  {
    name: FeatureNames.WebhookVerifiedContent,
    schema: {
      signingSecretKey: {
        doc: 'The secret key for signing verified content passed into the database and for signing webhooks',
        format: String,
        default: null,
        env: 'SIGNING_SECRET_KEY',
      },
      webhookQueueUrl: {
        doc: 'URL of AWS SQS queue for webhook retries',
        format: String,
        default: '',
        env: 'WEBHOOK_SQS_URL',
      },
    },
  }

export default webhookVerifiedContentFeature
