import type { Merge } from 'type-fest'

import {
  AttachmentResponse,
  FieldResponse,
  StorageModeSubmissionContentDto,
} from '../../../shared/types'
import { IPopulatedEncryptedForm, IPopulatedForm } from '../form'

import { ParsedEmailModeSubmissionBody } from './email_submission'

export type EncryptSubmissionDto = Merge<
  StorageModeSubmissionContentDto,
  { responses: EncryptFormFieldResponse[] }
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
  version: number
}

export type FormLoadedDto = {
  featureFlags: string[]
  formDef: IPopulatedForm
  encryptedFormDef: IPopulatedEncryptedForm
}

export type EncryptingPayloadDto = {
  formsg: FormLoadedDto & {
    encryptedPayload?: EncryptSubmissionDto
  }
}

export type FormsgCompleteDto = {
  formsg: FormLoadedDto & {
    encryptedPayload: EncryptSubmissionDto
  }
}
