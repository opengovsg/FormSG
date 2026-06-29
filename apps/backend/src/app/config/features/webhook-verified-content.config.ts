import convict, { Schema } from 'convict'

import { WebhookAttemptStoreMode } from '../../../types/webhook_attempt'

export interface IWebhooksAndVerifiedContent {
  signingSecretKey: string
  webhookQueueUrl: string
  webhookAttemptTtlDays: number
  webhookAttemptStoreMode: WebhookAttemptStoreMode
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
  webhookAttemptTtlDays: {
    doc: 'Number of days a webhook_attempts record is retained before the TTL index reaps it. Keep >= the effective retry + manual bulk-redrive window.',
    format: 'nat',
    default: 7,
    env: 'WEBHOOK_ATTEMPT_TTL_DAYS',
  },
  webhookAttemptStoreMode: {
    doc: 'Whether to record a webhook_attempts entry on every send, or only when a send fails and a retry is enqueued.',
    format: Object.values(WebhookAttemptStoreMode),
    default: WebhookAttemptStoreMode.OnEverySend,
    env: 'WEBHOOK_ATTEMPT_STORE_MODE',
  },
}

export const webhooksAndVerifiedContentConfig = convict(
  webhooksAndVerifiedContentSchema,
)
  .validate({ allowed: 'strict' })
  .getProperties()
