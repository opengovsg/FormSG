import { Merge } from 'type-fest'

import {
  AttachmentResponse,
  FieldResponse,
} from '../../../shared/types/response'
import { StorageModeSubmissionContentDto } from '../../../shared/types/submission'

export { StorageModeAttachmentsMap } from '../../../shared/types/submission'

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
