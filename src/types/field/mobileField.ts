import { BasicField, MobileFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export type IMobileField = MobileFieldBase

export interface IVerifiableMobileField extends IMobileField {
  isVerifiable: true
}

export interface IMobileFieldSchema extends IMobileField, IFieldSchema {
  fieldType: BasicField.Mobile
  isVerifiable: boolean
}
