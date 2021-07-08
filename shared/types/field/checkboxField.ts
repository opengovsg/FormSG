import { FieldBase } from './base'

export type CheckboxValidationOptions = {
  customMax: number | null
  customMin: number | null
}

export interface CheckboxFieldBase extends FieldBase {
  fieldOptions: string[]
  othersRadioButton: boolean
  ValidationOptions: CheckboxValidationOptions
  validateByValue: boolean
}
