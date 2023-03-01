import type { Opaque, RequireAtLeastOne } from 'type-fest'
import { z } from 'zod'

import { ErrorDto } from './core'
import { FormFieldDto, MyInfoAttribute } from './field'
import { FormAuthType } from './form/form'
import { DateString } from './generic'
import { EmailResponse, FieldResponse, MobileResponse } from './response'

export type SubmissionId = Opaque<string, 'SubmissionId'>
export const SubmissionId = z.string() as unknown as z.Schema<SubmissionId>

export enum SubmissionType {
  Email = 'emailSubmission',
  Encrypt = 'encryptSubmission',
}

export const SubmissionBase = z.object({
  form: z.string(),
  authType: z.nativeEnum(FormAuthType),
  myInfoFields: z.array(z.nativeEnum(MyInfoAttribute)).optional(),
  submissionType: z.nativeEnum(SubmissionType),
})
export type SubmissionBase = z.infer<typeof SubmissionBase>

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

export const WebhookResponse = z.object({
  webhookUrl: z.string(),
  signature: z.string(),
  response: z.object({
    status: z.number(),
    headers: z.string(),
    data: z.string(),
  }),
})

export type WebhookResponse = z.infer<typeof WebhookResponse>

/**
 * Storage mode submission typings as stored in the database.
 */

export const StorageModeSubmissionBase = SubmissionBase.extend({
  submissionType: z.literal(SubmissionType.Encrypt),
  encryptedContent: z.string(),
  verifiedContent: z.string().optional(),
  attachmentMetadata: z.map(z.string(), z.string()).optional(),
  version: z.number(),
  webhookResponses: z.array(WebhookResponse).optional(),
})
export type StorageModeSubmissionBase = z.infer<
  typeof StorageModeSubmissionBase
>

export type StorageModeSubmissionDto = {
  refNo: SubmissionId
  submissionTime: string
  content: string
  verified?: string
  attachmentMetadata: Record<string, string>
  version: number
}

export const StorageModeSubmissionStreamDto = StorageModeSubmissionBase.pick({
  encryptedContent: true,
  verifiedContent: true,
  version: true,
}).extend({
  attachmentMetadata: z.record(z.string()),
  _id: SubmissionId,
  created: DateString,
})

export type StorageModeSubmissionStreamDto = z.infer<
  typeof StorageModeSubmissionStreamDto
>

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
  // Timestamp is given as ms from epoch
  timestamp: number
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
