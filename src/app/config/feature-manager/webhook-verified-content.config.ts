import convict, { Schema } from 'convict'

export interface IWebhooksAndVerifiedContent {
  signingSecretKey: string
  webhookQueueUrl: string
}

const webhooksAndVerifiedContentSchema: Schema<IWebhooksAndVerifiedContent> = {
  signingSecretKey: {
    doc: 'The secret key for signing verified content passed into the database and for signing webhooks',
    format: String,
    default: null,
    env: 'SIGNING_SECRET_KEY',
  },
  webhookQueueUrl: {
    doc: 'URL of AWS SQS queue for webhook retries',
    format: String,
    // Allow this to default to empty string so retries can be disabled easily
    default: '',
    env: 'WEBHOOK_SQS_URL',
  },
}

export const webhooksAndVerifiedContentConfig = convict(
  webhooksAndVerifiedContentSchema,
)
  .validate({ allowed: 'strict' })
  .getProperties()
