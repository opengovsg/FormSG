import { BasicField, LongTextFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface ILongTextFieldSchema extends LongTextFieldBase, IFieldSchema {
  fieldType: BasicField.LongText
}
