import { FormWorkflowDto, WebhookSubmittedStep } from 'formsg-shared/types'
import * as z from 'zod'

import { IFormSchema, ISubmissionSchema, WebhookView } from '../../../types'

import {
  QUEUE_MESSAGE_LIVE_ROW_VERSION,
  QUEUE_MESSAGE_SNAPSHOT_VERSION,
} from './webhook.constants'

export interface WebhookParams {
  webhookUrl: string
  submissionWebhookView: WebhookView
  submissionId: ISubmissionSchema['_id']
  formId: IFormSchema['_id']
  now: number
  signature: string
}

const retrySchedule = {
  submissionId: z.string().regex(/^[a-f\d]{24}$/i),
  previousAttempts: z.array(z.number()),
  nextAttempt: z.number(),
}

/**
 * The message shape enqueued before the snapshot retry path shipped. In-flight
 * ones must keep parsing across the deploy; they name no step submission, so
 * they are redelivered from the live submission row.
 */
const LiveRowQueueMessage = z.object({
  ...retrySchedule,
  _v: z.literal(QUEUE_MESSAGE_LIVE_ROW_VERSION),
})

const SnapshotRef = z.object({
  submissionIndex: z.number().int(),
  contentFormat: z.enum(['v1', 'v4']),
})
export type SnapshotRef = z.infer<typeof SnapshotRef>

/**
 * The current message shape. It names the step submission to redeliver and the
 * wire shape to deliver it in, both fixed at enqueue time: an admin toggling
 * `webhookFormat`, or an operator flipping a feature flag, between the initial
 * send and a retry must not change what the retry delivers.
 */
const SnapshotQueueMessage = z.object({
  ...retrySchedule,
  _v: z.literal(QUEUE_MESSAGE_SNAPSHOT_VERSION),
  snapshotRef: SnapshotRef,
})

/**
 * Schema for webhook queue message, which allows an object to be validated.
 * An unknown `_v` fails to parse rather than defaulting to either path.
 */
export const webhookMessageSchema = z.discriminatedUnion('_v', [
  SnapshotQueueMessage,
  LiveRowQueueMessage,
])

/**
 * Shape of webhook queue message object.
 */
export type WebhookQueueMessageObject = z.infer<typeof webhookMessageSchema>

/**
 * The content format shape a retry must deliver, fixed at enqueue time.
 */
export type QueueMessageContentFormat = SnapshotRef['contentFormat']

/**
 * Webhook queue message object formatted for readable logs.
 */
export type WebhookQueueMessagePrettified = Omit<
  WebhookQueueMessageObject,
  'previousAttempts' | 'nextAttempt'
> & {
  previousAttempts: string[]
  nextAttempt: string
  snapshotRef?: SnapshotRef
}

/**
 * Failed webhook queue message formatted for readable logs.
 * Same as a regular queue message except no next attempt.
 */
export type WebhookFailedQueueMessage = Omit<
  WebhookQueueMessagePrettified,
  'nextAttempt'
>

/**
 * Specification of when a webhook should be retried.
 */
export type RetryInterval = {
  base: number
  jitter: number
}

export type PaymentWebhookEventType = 'payment_charge'

export type PaymentWebhookEventObject = {
  type: PaymentWebhookEventType
  [key: string]: unknown
}

export type WorkflowWebhookEventObject = {
  workflow: FormWorkflowDto
  workflowStep: number
  submittedSteps: WebhookSubmittedStep[]
}
