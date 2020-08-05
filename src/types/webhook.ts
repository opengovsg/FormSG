import { IFormSchema } from './form'
import {
  ISubmissionSchema,
  IWebhookResponseSchema,
  WebhookView,
} from './submission'

export type WebhookParams = {
  webhookUrl: string
  submissionWebhookView: WebhookView
  submissionId: ISubmissionSchema['_id']
  formId: IFormSchema['_id']
  now: number
  signature: string
}

export type LogWebhookParams = {
  submissionId: ISubmissionSchema['_id']
  formId: IFormSchema['_id']
  now: number
  webhookUrl: string
  signature: string
  status?: number
  errorMessage?: string
}

export type WebhookResponse = Pick<IWebhookResponseSchema, 'response'>
