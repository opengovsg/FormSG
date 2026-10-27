import { BasicField, FieldBase } from './base'
import type { PresignedPost } from '@aws-sdk/s3-presigned-post'

export enum AttachmentSize {
  OneMb = '1',
  TwoMb = '2',
  ThreeMb = '3',
  FourMb = '4',
  SevenMb = '7',
  TenMb = '10',
  TwentyMb = '20',
}

export interface AttachmentFieldBase extends FieldBase {
  fieldType: BasicField.Attachment
  attachmentSize: AttachmentSize
  /**
   * PROTOTYPE (attachments-v2): extensions this field accepts, e.g. ['.pdf'].
   * Absent means every type on VALID_EXTENSIONS. Stored, not yet enforced on submit.
   */
  allowedFileTypes?: string[]
  /**
   * PROTOTYPE (attachments-v2): respondents can attach any number of files,
   * within the field's size limit. Absent means one file. Stored, not yet
   * enforced on submit.
   */
  allowMultipleAttachments?: boolean
}

export type AttachmentSizeMapType = {
  id: string
  size: number
}

export type AttachmentPresignedPostDataMapType = {
  id: string
  presignedPostData: PresignedPost
}
