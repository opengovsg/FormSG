import { FieldBase } from './base'
import { TextValidationOptions } from './utils'

export interface LongTextFieldBase extends FieldBase {
  ValidationOptions: TextValidationOptions
}
