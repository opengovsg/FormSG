import { BasicField, DecimalFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IDecimalFieldSchema extends DecimalFieldBase, IFieldSchema {
  fieldType: BasicField.Decimal
}
