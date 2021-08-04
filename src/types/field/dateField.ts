import { BasicField, DateFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { DateSelectedValidation } from '../../../shared/types/field'

export { DateFieldBase }

export interface IDateFieldSchema extends DateFieldBase, IFieldSchema {
  fieldType: BasicField.Date
}
