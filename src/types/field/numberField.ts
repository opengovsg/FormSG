import { BasicField, NumberFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface INumberFieldSchema extends NumberFieldBase, IFieldSchema {
  fieldType: BasicField.Number
}
