import { FieldBase } from './base'

export interface RadioFieldBase extends FieldBase {
  fieldOptions: string[]
  othersRadioButton: boolean
}
