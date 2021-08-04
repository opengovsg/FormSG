import { BasicField, NricFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { NricFieldBase }

export interface INricFieldSchema extends NricFieldBase, IFieldSchema {
  fieldType: BasicField.Nric
}
