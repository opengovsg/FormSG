import { BasicField, FieldBase } from './base'
import { PresignedPost } from 'aws-sdk/clients/s3'

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
}

export type AttachmentSizeMapType = {
  id: string
  size: number
}

export type AttachmentPresignedPostDataMapType = {
  id: string
  presignedPostData: PresignedPost
}
