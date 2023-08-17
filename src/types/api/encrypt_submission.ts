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

export type StorageModeSubmissionBodyWithContext =
  ParsedStorageModeSubmissionBody & {
    formsg: {
      formDef?: IPopulatedForm
      encryptedPayload?: EncryptSubmissionDto
      encryptedFormDef?: IPopulatedEncryptedForm
    }
  }

export type EncryptSubmissionDtoWithContext = EncryptSubmissionDto & {
  formsg: {
    formDef?: IPopulatedForm
    encryptedPayload?: EncryptSubmissionDto
    encryptedFormDef?: IPopulatedEncryptedForm
  }
}
