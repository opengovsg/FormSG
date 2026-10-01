import {
  AllowCorppassBase,
  BasicField,
  CorppassAttribute,
  FieldBase,
  MyInfoableFieldBase,
} from './base'
import { TextValidationOptions } from './utils'

export interface ShortTextFieldBase
  extends
    MyInfoableFieldBase,
    FieldBase,
    AllowCorppassBase<CorppassAttribute.Uid> {
  fieldType: BasicField.ShortText
  ValidationOptions: TextValidationOptions
  allowPrefill?: boolean
  lockPrefill?: boolean
}
