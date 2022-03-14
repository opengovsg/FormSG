import { BasicField, ShortTextFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IShortTextFieldSchema
  extends ShortTextFieldBase,
    IFieldSchema {
  fieldType: BasicField.ShortText
}
