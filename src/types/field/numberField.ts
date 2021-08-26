import { BasicField, NumberFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface INumberFieldSchema extends NumberFieldBase, IFieldSchema {
  fieldType: BasicField.Number
}
