import { BasicField, LongTextFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { LongTextFieldBase }

export interface ILongTextFieldSchema extends LongTextFieldBase, IFieldSchema {
  fieldType: BasicField.LongText
}
