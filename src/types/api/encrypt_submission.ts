import type { Merge } from 'type-fest'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'

import {
  AttachmentResponse,
  FieldResponse,
  PaymentFieldsDto,
  ProductItem,
  StorageModeSubmissionContentDto,
} from '../../../shared/types'
import { IPopulatedEncryptedForm, IPopulatedForm } from '../form'

import { ParsedEmailModeSubmissionBody } from './email_submission'
import { ParsedClearFormFieldResponse } from './submission'

export type EncryptSubmissionDto = Merge<
  StorageModeSubmissionContentDto,
  { responses: EncryptFormFieldResponse[] | ProcessedFieldResponse[] }
>

export type EncryptAttachmentResponse = AttachmentResponse & {
  filename: never
  content: never
}

export type EncryptFormFieldResponse =
  | Exclude<FieldResponse, AttachmentResponse>
  | EncryptAttachmentResponse

/**
 * Storage submission body after req.body's FormData has passed through the
 * ReceiverMiddleware.receiveStorageSubmission middleware.
 */
export type ParsedStorageModeSubmissionBody = ParsedEmailModeSubmissionBody & {
  paymentProducts?: Array<ProductItem>
  paymentReceiptEmail?: string
  payments?: PaymentFieldsDto
  version: number
}

export type EncryptFormLoadedDto = {
  featureFlags: string[]
  formDef: IPopulatedForm
  encryptedFormDef: IPopulatedEncryptedForm
}

export type FormFilteredResponseDto = EncryptFormLoadedDto & {
  filteredResponses: ParsedClearFormFieldResponse[]
}

export type FormCompleteDto = FormFilteredResponseDto & {
  encryptedPayload: EncryptSubmissionDto
}
