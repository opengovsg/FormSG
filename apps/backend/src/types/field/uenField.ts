import { BasicField, UenFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IUenFieldSchema extends UenFieldBase, IFieldSchema {
  fieldType: BasicField.Uen
}
