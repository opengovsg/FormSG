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
   * Absent means every type on VALID_EXTENSIONS. Not yet in the Mongoose schema.
   */
  allowedFileTypes?: string[]
  /**
   * PROTOTYPE (attachments-v2): most files a respondent can attach, 1 to 10.
   * Absent means 1. Not yet in the Mongoose schema.
   */
  maxFiles?: number
}

export type AttachmentSizeMapType = {
  id: string
  size: number
}

export type AttachmentPresignedPostDataMapType = {
  id: string
  presignedPostData: PresignedPost
}
