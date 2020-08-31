import { IFormSchema } from '../../../types/form'
import { ISubmissionSchema, WebhookView } from '../../../types/submission'

export type WebhookParams = {
  webhookUrl: string
  submissionWebhookView: WebhookView
  submissionId: ISubmissionSchema['_id']
  formId: IFormSchema['_id']
  now: number
  signature: string
}
