import { Document, Model } from 'mongoose'

import { MyInfoAttribute } from './field'
import { AuthType, IFormSchema } from './form'

export enum SubmissionType {
  Email = 'emailSubmission',
  Encrypt = 'encryptSubmission',
}

export interface ISubmission {
  form: IFormSchema['_id']
  authType: AuthType
  myInfoFields: MyInfoAttribute[]
  submissionType: SubmissionType
  created?: Date
  lastModified?: Date
  _id: Document['_id']
  recipientEmails?: string[]
  responseHash?: string
  responseSalt?: string
  hasBounced?: boolean
  encryptedContent?: string
  verifiedContent?: string
  version?: number
  attachmentMetadata?: Map<string, string>
  webhookResponses?: IWebhookResponse[]
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

export interface ISubmissionSchema extends ISubmission, Document {
  getWebhookView(): WebhookView | null
}

export interface IEmailSubmission extends ISubmission {
  recipientEmails: string[]
  responseHash: string
  responseSalt: string
  hasBounced: boolean
  encryptedContent: never
  verifiedContent: never
  version: never
  attachmentMetadata: never
  webhookResponses: never
  getWebhookView(): WebhookView | null
}

export type IEmailSubmissionSchema = IEmailSubmission & ISubmissionSchema

export interface IEncryptedSubmission extends ISubmission {
  recipientEmails: never
  responseHash: never
  responseSalt: never
  hasBounced: never
  encryptedContent: string
  verifiedContent?: string
  version: number
  attachmentMetadata?: Map<string, string>
  webhookResponses: IWebhookResponse[]
  getWebhookView(): WebhookView | null
}

export type IEncryptedSubmissionSchema = IEncryptedSubmission &
  ISubmissionSchema

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

export type IEmailSubmissionModel = Model<IEmailSubmissionSchema>
export type IEncryptSubmissionModel = Model<IEncryptedSubmissionSchema>

export interface IWebhookResponseSchema extends IWebhookResponse, Document {}
