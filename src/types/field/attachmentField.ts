import { IField, IFieldSchema } from './baseField'

export enum AttachmentSize {
  OneMb = '1',
  TwoMb = '2',
  ThreeMb = '3',
  FourMb = '4',
  FiveMb = '5',
  SixMb = '6',
  SevenMb = '7',
  EightMb = '8',
  NineMb = '9',
  TenMb = '10',
  ElevenMb = '11',
  TwelveMb = '12',
  ThirteenMb = '13',
  FourteenMb = '14',
  FifteenMb = '15',
  SixteenMb = '16',
  SeventeenMb = '17',
  EighteenMb = '18',
  NineteenMb = '19',
  TwentyMb = '20',
}

export interface IAttachmentField extends IField {
  attachmentSize: AttachmentSize
}

export interface IAttachmentFieldSchema
  extends IAttachmentField,
    IFieldSchema {}
