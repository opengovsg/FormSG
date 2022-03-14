import { BasicField, NricFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface INricFieldSchema extends NricFieldBase, IFieldSchema {
  fieldType: BasicField.Nric
}
