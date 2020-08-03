import { IField } from './baseField'

export enum AttachmentSize {
  OneMb = '1',
  ThreeMb = '3',
  SevenMb = '7',
}

export interface IAttachmentField extends IField {
  attachmentSize: AttachmentSize
}
