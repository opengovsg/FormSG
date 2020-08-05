import { Document } from 'mongoose'

import { MyInfoAttribute } from './field'
import { AuthType, IFormSchema } from './form'

export enum SubmissionType {
  Email = 'emailSubmission',
  Encrypt = 'encryptSubmission',
}

export interface ISubmission {
  form: IFormSchema['_id']
  authType: AuthType
  myInfoFields: MyInfoAttribute
  submissionType: SubmissionType
  created: Date
  lastModified: Date
  _id: Document['_id']
}

export interface ISubmissionSchema extends ISubmission, Document {
  getWebhookView(): WebhookView | null
}

export interface WebhookData {
  formId: string
  submissionId: string
  encryptedContent: string
  verifiedContent: string
  version: number
  created: Date
}

export interface WebhookView {
  data: WebhookData
}

export interface IEmailSubmission extends ISubmission {
  recipientEmails?: string[]
  responseHash: string
  responseSalt: string
  hasBounced: boolean
}

export interface IEmailSubmissionSchema
  extends IEmailSubmission,
    ISubmissionSchema {}

export interface IEncryptedSubmission extends ISubmission {
  encryptedContent: string
  verifiedContent?: string
  version: number
  attachmentMetadata?: Map<string, string>
  webhookResponses: IWebhookResponse[]
}

export interface IWebhookResponse {
  webhookUrl: string
  signature: string
  errorMessage?: string
  response?: {
    status: number
    statusText: string
    headers: string
    data: string
  }
}

export interface IWebhookResponseSchema extends IWebhookResponse, Document {}

export interface IEncryptedSubmissionSchema
  extends IEncryptedSubmission,
    ISubmissionSchema {}
