import { BasicField, UenFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IUenFieldSchema extends UenFieldBase, IFieldSchema {
  fieldType: BasicField.Uen
}
