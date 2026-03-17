import { BasicField, DateFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IDateFieldSchema extends DateFieldBase, IFieldSchema {
  fieldType: BasicField.Date
}
