import { IField, IFieldSchema } from './baseField'

export enum AttachmentSize {
  OneMb = '1',
  ThreeMb = '3',
  SevenMb = '7',
}

export interface IAttachmentField extends IField {
  attachmentSize: AttachmentSize
}

export interface IAttachmentFieldSchema
  extends IAttachmentField,
    IFieldSchema {}
