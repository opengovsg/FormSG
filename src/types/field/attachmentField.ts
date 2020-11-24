import { IField, IFieldSchema } from './baseField'

export enum AttachmentSize {
  OneMb = '1',
  TwoMb = '2',
  ThreeMb = '3',
  SevenMb = '7',
  TenMb = '10',
  TwentyMb = '20',
}

export interface IAttachmentField extends IField {
  attachmentSize: AttachmentSize
}

export interface IAttachmentFieldSchema
  extends IAttachmentField,
    IFieldSchema {}
