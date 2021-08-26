import { BasicField, DecimalFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IDecimalFieldSchema extends DecimalFieldBase, IFieldSchema {
  fieldType: BasicField.Decimal
}
