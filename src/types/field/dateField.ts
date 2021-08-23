import { BasicField, DateFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { DateSelectedValidation } from '../../../shared/types/field'

export type IDateField = DateFieldBase

export interface IDateFieldSchema extends DateFieldBase, IFieldSchema {
  fieldType: BasicField.Date
}
