import {
  IEncryptedSubmissionSchema,
  IFormSchema,
  ISubmissionSchema,
  WebhookView,
} from '@root/types'

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
