import type { Opaque, RequireAtLeastOne } from 'type-fest'
import { z } from 'zod'

import { ErrorDto } from './core'
import { FormFieldDto, MyInfoAttribute, PaymentFieldsDto } from './field'
import { FormAuthType, StrippedFormFieldDto } from './form/form'
import { DateString } from './generic'
import { EmailResponse, FieldResponse, MobileResponse } from './response'
import { PaymentStatus } from './payment'
import {
  FormWorkflowDto,
  LogicDto,
  ProductItem,
  StrippedFormWorkflowDto,
} from './form'
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

export const SubmissionBase = z.object({
  form: z.string(),
  authType: z.nativeEnum(FormAuthType),
  submitterId: z.string().optional(),
  myInfoFields: z.array(z.nativeEnum(MyInfoAttribute)).optional(),
  submissionType: z.nativeEnum(SubmissionType),
  responseMetadata: ResponseMetadata.optional(),
  webhookResponses: z.array(WebhookResponse).optional(),
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

/**
 * Storage mode submission typings as stored in the database.
 */

export const StorageModeSubmissionBase = SubmissionBase.extend({
  submissionType: z.literal(SubmissionType.Encrypt),
  encryptedContent: z.string(),
  verifiedContent: z.string().optional(),
  attachmentMetadata: z.map(z.string(), z.string()).optional(),
  version: z.number(),
  paymentId: z.string().optional(),
})

export type StorageModeSubmissionBase = z.infer<
  typeof StorageModeSubmissionBase
>

/**
 * Multirespondent submission typings as stored in the database.
 */

export enum WorkflowStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export const ApprovalStatus = z.enum([
  WorkflowStatus.APPROVED,
  WorkflowStatus.REJECTED,
])

const SubmittedNonApprovalStep = z.object({
  isApproval: z.literal(false),
  submittedAt: z.string().datetime({ precision: 3 }),
  nextStepRecipientEmails: z.array(z.string()).optional(),
  submitterId: z.string().optional(),
  // RATIONALE: per-attempt S3 snapshot key leaf recorded on the winning step
  // entry so the send path can point-read the frozen snapshot for THIS step;
  // never included in a webhook payload.
  snapshotToken: z.string().optional(),
})

export type SubmittedNonApprovalStep = z.infer<typeof SubmittedNonApprovalStep>

const SubmittedApprovalStep = SubmittedNonApprovalStep.extend({
  isApproval: z.literal(true),
  status: ApprovalStatus,
})

export type SubmittedApprovalStep = z.infer<typeof SubmittedApprovalStep>

export const SubmittedStep = z.discriminatedUnion('isApproval', [
  SubmittedApprovalStep,
  SubmittedNonApprovalStep,
])

export type SubmittedStep = z.infer<typeof SubmittedStep>

/**
 * Every field of the step subdocument.
 *
 * RATIONALE: this is the UNION of both members' keys, not `keyof
 * SubmittedStep`. `SubmittedStep` is a discriminated union, and `keyof` over a
 * union yields the *intersection* of its members' keys — so approval-only
 * fields such as `status` would silently escape classification and leak by
 * default.
 *
 * The obvious spelling `keyof (SubmittedNonApprovalStep &
 * SubmittedApprovalStep)` does not work either: the two members disagree on the
 * discriminant, so `isApproval: false & true` is `never`, TypeScript reduces
 * the whole intersection to `never`, and `keyof never` widens to `string |
 * number | symbol` — which any object literal satisfies, silently disabling the
 * exhaustiveness check below.
 */
export type SubmittedStepField =
  | keyof SubmittedNonApprovalStep
  | keyof SubmittedApprovalStep

/**
 * The boundaries at which `submittedSteps` leaves the server.
 * - `webhook`: the array shipped verbatim inside `workflowContent`.
 * - `statusTracker`: the public, submission-id-reachable tracker response.
 * - `admin`: the two authenticated admin queries, projected in Mongo.
 */
export type SubmittedStepBoundary = 'webhook' | 'statusTracker' | 'admin'

/**
 * The single source of truth for which step fields cross which boundary.
 *
 * A field added to the subdocument above without a row here fails to compile
 * (see the `satisfies` below), so new fields are private until classified
 * rather than public by default.
 */
export const SUBMITTED_STEP_VISIBILITY = {
  // Ships today; the workflow status is derived from it.
  isApproval: { webhook: true, statusTracker: true, admin: true },
  // Ships today; `lastSubmittedAt` in the admin metadata is derived from it.
  submittedAt: { webhook: true, statusTracker: true, admin: true },
  // Ships today; the workflow status is derived from it.
  status: { webhook: true, statusTracker: true, admin: true },
  // Respondent emails. Ship to webhook consumers today (narrowing them would be
  // a silent breaking change) and are already stripped from the unauthenticated
  // status tracker. Read server-side by `buildMrfMetadata`, so admin keeps them.
  nextStepRecipientEmails: {
    webhook: true,
    statusTracker: false,
    admin: true,
  },
  // Ships today at both public boundaries; deliberately left as-is — it
  // predates this table and needs its own consumer audit. Unread on the admin
  // paths, so it is not loaded there.
  submitterId: { webhook: true, statusTracker: true, admin: false },
  // Internal per-attempt S3 snapshot key leaf. Never crosses any boundary.
  snapshotToken: { webhook: false, statusTracker: false, admin: false },
} as const satisfies Record<
  SubmittedStepField,
  Record<SubmittedStepBoundary, boolean>
>

type SubmittedStepVisibility = typeof SUBMITTED_STEP_VISIBILITY

type VisibleFieldsAt<B extends SubmittedStepBoundary> = {
  [K in keyof SubmittedStepVisibility]: SubmittedStepVisibility[K][B] extends true
    ? K
    : never
}[keyof SubmittedStepVisibility]

/**
 * Distributes over the discriminated union so each member keeps only the fields
 * it actually declares that are visible at `B`.
 */
type ProjectSubmittedStep<
  S,
  B extends SubmittedStepBoundary,
> = S extends unknown ? Pick<S, Extract<keyof S, VisibleFieldsAt<B>>> : never

/** The step shape webhook consumers receive. */
export type WebhookSubmittedStep = ProjectSubmittedStep<
  SubmittedStep,
  'webhook'
>

/** The step shape the public status tracker returns. */
export type StatusTrackerSubmittedStep = ProjectSubmittedStep<
  SubmittedStep,
  'statusTracker'
>

/** The step shape the admin queries load out of Mongo. */
export type AdminSubmittedStep = ProjectSubmittedStep<SubmittedStep, 'admin'>

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
  verifiedContent: z.string().optional(),
  attachmentMetadata: z.map(z.string(), z.string()).optional(),
  version: z.number(),
  workflowStep: z.number(),
  mrfVersion: z.number().optional(),
  submittedSteps: z.array(SubmittedStep).optional(),
  // RATIONALE: optional for backwards compatibility on
  // in-flight mrf steps which do not have a step token at time of creation.
  stepTokenHash: z.string().optional(),
  encryptedStepToken: z.string().optional(),
})

export type MultirespondentSubmissionBase = z.infer<
  typeof MultirespondentSubmissionBase
>

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
  verifiedContent?: string
  submissionPublicKey: string
  encryptedSubmissionSecretKey: string
  encryptedStepToken?: string
  encryptedContent: string
  attachmentMetadata: Record<string, string>
  workflowStep: number

  version: number
  mrfVersion: number

  mrfMeta: SubmissionMrfMetadata
}

export type PublicMultirespondentSubmissionDto = Omit<
  MultirespondentSubmissionDto,
  'workflow' | 'form_fields' | 'encryptedStepToken'
> & {
  form_fields: StrippedFormFieldDto[]
  workflow: StrippedFormWorkflowDto
  encryptedStepToken: undefined
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
    verifiedContent: true,
    version: true,
    mrfVersion: true,
  }).extend({
    attachmentMetadata: z.record(z.string()),
    _id: SubmissionId,
    created: DateString,
    mrfMeta: z.object({
      workflowCurrentStepNumber: z.number(),
      workflowNumTotalSteps: z.number(),
      workflowStatus: z.nativeEnum(WorkflowStatus).optional(),
      lastSubmittedAt: z.string().optional(),
      hasNextStepRecipientEmails: z.boolean(),
    }),
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

export type SubmissionMrfMetadata =
  | {
      workflowCurrentStepNumber: number
      workflowNumTotalSteps: number
      workflowStatus: WorkflowStatus | undefined // `undefined` is due to submissions before this PR not storing this value
      lastSubmittedAt: string | undefined
      hasNextStepRecipientEmails: boolean
    }
  | undefined

export type SubmissionMetadata = {
  number: number
  refNo: SubmissionId
  /** Not a DateString, format is `Do MMM YYYY, h:mm:ss a` */
  submissionTime: string
  payments: SubmissionPaymentMetadata
  mrf?: SubmissionMrfMetadata
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

  // mrf only fields
  mrfStep?: number
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
  respondentEmails?: string[]
}

export type PaymentSubmissionData = {
  paymentId: string
}

export type StatusTrackerData = {
  submittedSteps: SubmittedStep[] | undefined
  workflow: StrippedFormWorkflowDto
  responseId: string | undefined
  form: string
}

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
export type AdminUseEmailModeFeedbackDto = {
  reason: {
    value: string[] | false
    othersInput?: string
  }
  adminEmail?: string
}
