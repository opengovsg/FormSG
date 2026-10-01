import { BasicField, UenFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IUenFieldSchema extends UenFieldBase, IFieldSchema {
  corppass?: UenFieldBase['corppass']
  fieldType: BasicField.Uen
}
