import { BasicField, DateFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IDateFieldSchema extends DateFieldBase, IFieldSchema {
  fieldType: BasicField.Date
}
