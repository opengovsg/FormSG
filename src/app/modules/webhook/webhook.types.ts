import {
  IEncryptedSubmission,
  IForm,
  ISubmissionSchema,
  WebhookView,
} from '../../../types'
import { IFormSchema } from '../../../types/form'

export type WebhookParams = {
  webhookUrl: string
  submissionWebhookView: WebhookView
  submissionId: ISubmissionSchema['_id']
  formId: IFormSchema['_id']
  now: number
  signature: string
}

export interface WebhookRequestLocals {
  form: IForm
  submission: IEncryptedSubmission
}
