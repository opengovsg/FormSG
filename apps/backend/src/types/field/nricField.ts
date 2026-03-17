import { BasicField, NricFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface INricFieldSchema extends NricFieldBase, IFieldSchema {
  fieldType: BasicField.Nric
}
