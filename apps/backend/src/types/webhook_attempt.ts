import type { Document, Model, Types } from 'mongoose'

import type { WebhookView } from './submission'

/**
 * Controls when a webhook attempt is recorded to the `webhook_attempts`
 * collection. `OnEverySend` keeps a full attempt log; `OnFailure` records only
 * when a send fails and a retry is enqueued (the minimal retry buffer).
 */
export enum WebhookAttemptStoreMode {
  OnEverySend = 'on-every-send',
  OnFailure = 'on-failure',
}

export type WebhookAttemptStatus = 'success' | 'failure'

export interface IWebhookAttempt {
  submissionId: Types.ObjectId
  // Position of the step in `submittedSteps` (0 for storage-mode / single-step).
  // Disambiguates loop-back MRF workflows so a retry replays the right step.
  submissionIndex: number
  formId: Types.ObjectId
  webhookUrl: string
  // 0 = initial send, N = Nth retry (= previousAttempts.length on the queue message).
  attemptNumber: number
  signature: string
  // The exact outgoing webhook body for this attempt (pre-presign; attachment
  // download URLs hold stable S3 keys and are re-presigned at delivery).
  payload: WebhookView
  response?: { status: number }
  status: WebhookAttemptStatus
  expireAt: Date
}

export interface IWebhookAttemptSchema extends IWebhookAttempt, Document {
  createdAt?: Date
  updatedAt?: Date
}

export type RecordWebhookAttemptParams = {
  submissionId: Types.ObjectId | string
  submissionIndex: number
  formId: Types.ObjectId | string
  webhookUrl: string
  attemptNumber: number
  signature: string
  payload: WebhookView
  response?: { status: number }
  status: WebhookAttemptStatus
  expireAt: Date
}

export interface IWebhookAttemptModel extends Model<IWebhookAttemptSchema> {
  recordAttempt: (
    params: RecordWebhookAttemptParams,
  ) => Promise<IWebhookAttemptSchema>
  /**
   * Returns the canonical captured body (attempt #0) for a step, used to
   * replay a retry byte-for-byte. `null` if no attempt was stored.
   */
  getReplayPayload: (
    submissionId: string,
    submissionIndex: number,
  ) => Promise<WebhookView | null>
}
