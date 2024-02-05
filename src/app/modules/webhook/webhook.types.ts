import * as z from 'zod'

import { IFormSchema, ISubmissionSchema, WebhookView } from '../../../types'

export interface WebhookParams {
  webhookUrl: string
  submissionWebhookView: WebhookView
  submissionId: ISubmissionSchema['_id']
  formId: IFormSchema['_id']
  now: number
  signature: string
}

/**
 * Schema for webhook queue message, which allows an object to be validated.
 */
export const webhookMessageSchema = z.object({
  submissionId: z.string().regex(/^[a-f\d]{24}$/i),
  previousAttempts: z.array(z.number()),
  nextAttempt: z.number(),
  _v: z.number(),
})

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
