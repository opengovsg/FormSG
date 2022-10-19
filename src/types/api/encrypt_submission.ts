import type { Merge } from 'type-fest'

import {
  AttachmentResponse,
  FieldResponse,
  StorageModeSubmissionContentDto,
} from '../../../shared/types'

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
