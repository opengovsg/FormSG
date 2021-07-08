import { FieldBase } from './base'

export type DecimalValidationOptions = {
  customMax: number | null
  customMin: number | null
}

export interface DecimalFieldBase extends FieldBase {
  ValidationOptions: DecimalValidationOptions
  validateByValue: boolean
}
