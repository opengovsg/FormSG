import { BasicField, LongTextFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface ILongTextFieldSchema extends LongTextFieldBase, IFieldSchema {
  fieldType: BasicField.LongText
}
