import { Opaque, RequireAtLeastOne } from 'type-fest'
import { ErrorDto } from './core'
import { FormFieldDto, MyInfoAttribute } from './field'
import { FormAuthType, FormDto } from './form/form'
import { DateString } from './generic'
import { EmailResponse, FieldResponse, MobileResponse } from './response'

export type SubmissionId = Opaque<string, 'SubmissionId'>

export enum SubmissionType {
  Email = 'emailSubmission',
  Encrypt = 'encryptSubmission',
}

export type SubmissionBase = {
  form: FormDto['_id']
  authType: FormAuthType
  myInfoFields?: MyInfoAttribute[]
  submissionType: SubmissionType
}

/**
 * Email mode submission typings as stored in the database.
 */
export interface EmailModeSubmissionBase extends SubmissionBase {
  submissionType: SubmissionType.Email
  recipientEmails: string[]
  responseHash: string
  responseSalt: string
  hasBounced: boolean
}

export type WebhookResponse = {
  webhookUrl: string
  signature: string
  response: {
    status: number
    headers: string
    data: string
  }
}

/**
 * Storage mode submission typings as stored in the database.
 */
export interface StorageModeSubmissionBase extends SubmissionBase {
  submissionType: SubmissionType.Encrypt
  encryptedContent: string
  verifiedContent?: string
  attachmentMetadata?: Map<string, string>
  version: number
  webhookResponses?: WebhookResponse[]
}

export type StorageModeSubmissionDto = {
  refNo: SubmissionId
  submissionTime: string
  content: string
  verified?: string
  attachmentMetadata: Record<string, string>
  version: number
}

export type StorageModeSubmissionStreamDto = Pick<
  StorageModeSubmissionBase,
  'encryptedContent' | 'verifiedContent' | 'version'
> & {
  attachmentMetadata: Record<string, string>
  _id: SubmissionId
  created: DateString
}

export type StorageModeSubmissionMetadata = {
  number: number
  refNo: SubmissionId
  /** Not a DateString, format is `Do MMM YYYY, h:mm:ss a` */
  submissionTime: string
}

export type StorageModeSubmissionMetadataList = {
  metadata: StorageModeSubmissionMetadata[]
  count: number
}

export type SubmissionResponseDto = {
  message: string
  submissionId: string
}

export type SubmissionErrorDto = ErrorDto & { spcpSubmissionFailure?: true }

export type SubmissionCountQueryDto =
  | {
      startDate: DateString
      endDate: DateString
    }
  | undefined

export type FormSubmissionMetadataQueryDto = RequireAtLeastOne<
  {
    page: number
    submissionId: string
  },
  'page' | 'submissionId'
>

/**
 * Shape of email form submissions
 */
export type EmailModeSubmissionContentDto = {
  responses: FieldResponse[]
}

export type StorageModeAttachment = {
  encryptedFile?: {
    binary: string
    nonce: string
    submissionPublicKey: string
  }
}

export type StorageModeAttachmentsMap = Record<
  FormFieldDto['_id'],
  StorageModeAttachment
>

export type StorageModeSubmissionContentDto = {
  // Storage mode only allows
  // 1. verifiable responses in order to validate signatures.
  // 2. email fields with autoreply to send form fillers their response.
  responses: Pick<
    EmailResponse | MobileResponse,
    'fieldType' | '_id' | 'answer' | 'signature'
  >[]
  encryptedContent: string
  attachments?: StorageModeAttachmentsMap
  version: number
}
