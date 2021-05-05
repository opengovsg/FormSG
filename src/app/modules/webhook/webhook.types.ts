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
  submissionId: z.string(),
  previousAttempts: z.array(z.number()),
  nextAttempt: z.number(),
  _v: z.number(),
})

/**
 * Shape of webhook queue message object.
 */
export type WebhookQueueMessageObject = z.infer<typeof webhookMessageSchema>

/**
 * Same as a regular queue message, except no next attempt
 */
export type WebhookFailedQueueMessage = Omit<
  WebhookQueueMessageObject,
  'nextAttempt'
>

/**
 * Specification of when a webhook should be retried.
 */
export type RetryInterval = {
  base: number
  jitter: number
}
