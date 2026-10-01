import { BasicField, ShortTextFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IShortTextFieldSchema
  extends ShortTextFieldBase, IFieldSchema {
  corppass?: ShortTextFieldBase['corppass']
  fieldType: BasicField.ShortText
}
