import { BasicField, MobileFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { MobileFieldBase }
export interface IVerifiableMobileField extends MobileFieldBase {
  isVerifiable: true
}
export interface IMobileFieldSchema extends MobileFieldBase, IFieldSchema {
  fieldType: BasicField.Mobile
  isVerifiable: boolean
}
