import { BasicField, DecimalFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { DecimalFieldBase }

export interface IDecimalFieldSchema extends DecimalFieldBase, IFieldSchema {
  fieldType: BasicField.Decimal
}
