import { BasicField, TimeFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface ITimeFieldSchema extends TimeFieldBase, IFieldSchema {
  fieldType: BasicField.Time
}
