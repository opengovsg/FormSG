import { IField, IFieldSchema } from './baseField'

export interface IMobileField extends IField {
  allowIntlNumbers: boolean
  isVerifiable: boolean
}

export interface IMobileFieldSchema extends IMobileField, IFieldSchema {
  isVerifiable: boolean
}
