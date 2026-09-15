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

const webhookMessageBaseSchema = {
  submissionId: z.string().regex(/^[a-f\d]{24}$/i),
  previousAttempts: z.array(z.number()),
  nextAttempt: z.number(),
}

/**
 * Retry queue message for which uses live row data for reconstructing retry payload.
 */
const LiveRowQueueMessage = z.object({
  ...webhookMessageBaseSchema,
  _v: z.literal(QUEUE_MESSAGE_LIVE_ROW_VERSION),
})

/**
 * Reference to the snapshot to be used for reconstructing retry payload.
 */
const SnapshotRef = z.object({
  submissionIndex: z.number().int(),
  contentFormat: z.enum(['v1', 'v4']),
})
export type SnapshotRef = z.infer<typeof SnapshotRef>

/**
 * Retry queue message for which uses snapshots for reconstructing retry payload.
 */
const SnapshotQueueMessage = z.object({
  ...webhookMessageBaseSchema,
  _v: z.literal(QUEUE_MESSAGE_SNAPSHOT_VERSION),
  snapshotRef: SnapshotRef,
})

/**
 * Schema for webhook retry queue message.
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
