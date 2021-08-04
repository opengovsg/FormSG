import { BasicField, ShortTextFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { ShortTextFieldBase }
export interface IShortTextFieldSchema
  extends ShortTextFieldBase,
    IFieldSchema {
  fieldType: BasicField.ShortText
}
