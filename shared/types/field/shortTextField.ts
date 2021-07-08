import { FieldBase, MyInfoableFieldBase } from './base'
import { TextValidationOptions } from './utils'

export interface ShortTextFieldBase extends MyInfoableFieldBase, FieldBase {
  ValidationOptions: TextValidationOptions
  allowPrefill?: boolean
}
