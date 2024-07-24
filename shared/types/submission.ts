import type { Opaque, RequireAtLeastOne } from 'type-fest'
import { z } from 'zod'

import { ErrorDto } from './core'
import { FormFieldDto, MyInfoAttribute, PaymentFieldsDto } from './field'
import { FormAuthType } from './form/form'
import { DateString } from './generic'
import { EmailResponse, FieldResponse, MobileResponse } from './response'
import { PaymentStatus } from './payment'
import { FormWorkflowDto, LogicDto, ProductItem } from './form'
import { ErrorCode } from './errorCodes'
export type SubmissionId = Opaque<string, 'SubmissionId'>
export const SubmissionId = z.string() as unknown as z.Schema<SubmissionId>

export enum SubmissionType {
  Email = 'emailSubmission',
  Encrypt = 'encryptSubmission',
  Multirespondent = 'multirespondentSubmission',
}

export const ResponseMetadata = z.object({
  responseTimeMs: z.number(),
  numVisibleFields: z.number(),
})

export type ResponseMetadata = z.infer<typeof ResponseMetadata>

export const SubmissionBase = z.object({
  form: z.string(),
  authType: z.nativeEnum(FormAuthType),
  submitterId: z.string().optional(),
  myInfoFields: z.array(z.nativeEnum(MyInfoAttribute)).optional(),
  submissionType: z.nativeEnum(SubmissionType),
  responseMetadata: ResponseMetadata.optional(),
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
  paymentId: z.string().optional(),
})

export type StorageModeSubmissionBase = z.infer<
  typeof StorageModeSubmissionBase
>

/**
 * Multirespondent submission typings as stored in the database.
 */

export const MultirespondentSubmissionBase = SubmissionBase.extend({
  // Store the form fields and logic here, to use as reference for future
  // submitters. Don't bother to validate since this is injected by the backend.
  form_fields: z.custom<FormFieldDto[]>(),
  form_logics: z.custom<LogicDto[]>(),
  workflow: z.custom<FormWorkflowDto>(),

  submissionType: z.literal(SubmissionType.Multirespondent),
  submissionPublicKey: z.string(),
  encryptedSubmissionSecretKey: z.string(),
  encryptedContent: z.string(),
  attachmentMetadata: z.map(z.string(), z.string()).optional(),
  version: z.number(),
  workflowStep: z.number(),
  mrfVersion: z.number().optional(),
})

export type MultirespondentSubmissionBase = z.infer<
  typeof MultirespondentSubmissionBase
>

export type StorageModeChartsDto = StorageModeSubmissionBase & {
  created: DateString
}

export const SubmissionPaymentDto = z.object({
  id: z.string(),
  paymentIntentId: z.string(),
  email: z.string(),
  products: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number(),
      }),
    )
    .optional(),
  amount: z.number(),
  status: z.nativeEnum(PaymentStatus),

  paymentDate: z.string(),
  transactionFee: z.number(),
  receiptUrl: z.string(),

  payoutId: z.string().optional(),
  payoutDate: z.string().optional(),
})
export type SubmissionPaymentDto = z.infer<typeof SubmissionPaymentDto>

export type SubmissionDtoBase = {
  submissionType: SubmissionType.Encrypt | SubmissionType.Multirespondent
  refNo: SubmissionId
  submissionTime: string
}

export type StorageModeSubmissionDto = SubmissionDtoBase & {
  submissionType: SubmissionType.Encrypt
  content: string
  verified?: string
  attachmentMetadata: Record<string, string>
  payment?: SubmissionPaymentDto
  version: number
}

export type MultirespondentSubmissionDto = SubmissionDtoBase & {
  submissionType: SubmissionType.Multirespondent
  form_fields: FormFieldDto[]
  form_logics: LogicDto[]
  workflow: FormWorkflowDto

  submissionPublicKey: string
  encryptedSubmissionSecretKey: string
  encryptedContent: string
  attachmentMetadata: Record<string, string>
  workflowStep: number

  version: number
  mrfVersion: number
}

export type SubmissionDto =
  | StorageModeSubmissionDto
  | MultirespondentSubmissionDto

export const StorageModeSubmissionStreamDto = StorageModeSubmissionBase.pick({
  submissionType: true,
  encryptedContent: true,
  verifiedContent: true,
  version: true,
}).extend({
  attachmentMetadata: z.record(z.string()),
  payment: z.optional(SubmissionPaymentDto),
  _id: SubmissionId,
  created: DateString,
})

export type StorageModeSubmissionStreamDto = z.infer<
  typeof StorageModeSubmissionStreamDto
>

export const MultirespondentSubmissionStreamDto =
  MultirespondentSubmissionBase.pick({
    submissionType: true,
    form_fields: true,
    form_logics: true,
    encryptedSubmissionSecretKey: true,
    encryptedContent: true,
    version: true,
    mrfVersion: true,
  }).extend({
    attachmentMetadata: z.record(z.string()),
    _id: SubmissionId,
    created: DateString,
  })

export type MultirespondentSubmissionStreamDto = z.infer<
  typeof MultirespondentSubmissionStreamDto
>

export const SubmissionStreamDto = z.discriminatedUnion('submissionType', [
  StorageModeSubmissionStreamDto,
  MultirespondentSubmissionStreamDto,
])

export type SubmissionStreamDto = z.infer<typeof SubmissionStreamDto>

export type SubmissionPaymentMetadata = {
  payoutDate: string | null
  paymentAmt: number
  transactionFee: number | null
  email: string
} | null

export type SubmissionMetadata = {
  number: number
  refNo: SubmissionId
  /** Not a DateString, format is `Do MMM YYYY, h:mm:ss a` */
  submissionTime: string
  payments: SubmissionPaymentMetadata
}

export type SubmissionMetadataList = {
  metadata: SubmissionMetadata[]
  count: number
}

export type SubmissionResponseDto = {
  message: string
  submissionId: string
  // Timestamp is given as ms from epoch
  timestamp: number

  // payment form only fields
  paymentData?: PaymentSubmissionData
}

export type SubmissionErrorDto = ErrorDto & {
  spcpSubmissionFailure?: true
  errorCodes?: ErrorCode[]
}

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

export type SubmissionAttachment = {
  encryptedFile?: {
    binary: string
    nonce: string
    submissionPublicKey: string
  }
}

export type SubmissionAttachmentsMap = Record<
  FormFieldDto['_id'],
  SubmissionAttachment
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
  attachments?: SubmissionAttachmentsMap
  paymentReceiptEmail?: string
  paymentProducts?: Array<ProductItem>
  version: number
  responseMetadata?: ResponseMetadata
  payments?: PaymentFieldsDto
}

export type PaymentSubmissionData = {
  paymentId: string
}
