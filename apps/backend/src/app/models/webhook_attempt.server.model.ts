import { Mongoose, Schema } from 'mongoose'

import {
  IWebhookAttemptModel,
  IWebhookAttemptSchema,
  WebhookView,
} from '../../types'

export const WEBHOOK_ATTEMPT_SCHEMA_ID = 'WebhookAttempt'

/**
 * Append-only log of webhook delivery attempts. Each document is the outgoing
 * body for one send, keyed by (submissionId, submissionIndex). Records are
 * reaped by a TTL index, so the collection only holds a rolling window of
 * recent attempts (it is a retry buffer + short-lived attempt log, not an
 * audit substrate).
 */
const WebhookAttemptSchema = new Schema<
  IWebhookAttemptSchema,
  IWebhookAttemptModel
>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    submissionIndex: {
      type: Number,
      required: true,
    },
    formId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    webhookUrl: {
      type: String,
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    response: {
      status: { type: Number },
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, collection: 'webhook_attempts' },
)

// Point lookup for retry replay + prefix scans by submission.
WebhookAttemptSchema.index({
  submissionId: 1,
  submissionIndex: 1,
  attemptNumber: 1,
})
// TTL: documents are removed once `expireAt` passes.
WebhookAttemptSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

// Statics
WebhookAttemptSchema.statics.recordAttempt = async function (params) {
  return this.create({ ...params })
}

WebhookAttemptSchema.statics.getReplayPayload = async function (
  submissionId: string,
  submissionIndex: number,
): Promise<WebhookView | null> {
  // Attempt #0 is the initial send — the canonical captured body to replay.
  const attempt = await this.findOne({
    submissionId,
    submissionIndex,
    attemptNumber: 0,
  })
    .sort({ createdAt: 1 })
    .exec()
  return attempt?.payload ?? null
}

/**
 * @param db - Active DB Connection
 * @returns WebhookAttempt model
 */
const getWebhookAttemptModel = (db: Mongoose): IWebhookAttemptModel => {
  try {
    return db.model<IWebhookAttemptSchema, IWebhookAttemptModel>(
      WEBHOOK_ATTEMPT_SCHEMA_ID,
    )
  } catch {
    return db.model<IWebhookAttemptSchema, IWebhookAttemptModel>(
      WEBHOOK_ATTEMPT_SCHEMA_ID,
      WebhookAttemptSchema,
    )
  }
}

export default getWebhookAttemptModel
