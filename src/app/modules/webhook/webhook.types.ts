import * as z from 'zod'

import {
  IEncryptedSubmissionSchema,
  IFormSchema,
  ISubmissionSchema,
  WebhookView,
} from '../../../types'

export interface WebhookParams {
  webhookUrl: string
  submissionWebhookView: WebhookView
  submissionId: ISubmissionSchema['_id']
  formId: IFormSchema['_id']
  now: number
  signature: string
}

export interface WebhookRequestLocals {
  form: IFormSchema
  submission: IEncryptedSubmissionSchema
}

export const webhookMessageSchema = z.object({
  submissionId: z.string(),
  previousAttempts: z.array(z.number()),
  nextAttempt: z.number(),
  _v: z.number(),
})

export type WebhookQueueMessageObject = z.infer<typeof webhookMessageSchema>

export type RetryInterval = {
  base: number
  jitter: number
}
