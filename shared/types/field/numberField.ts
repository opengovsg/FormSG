import { BasicField, MyInfoableFieldBase } from './base'

export enum NumberSelectedValidation {
  Length = 'Character Length',
  Range = 'Number Range',
}

export enum NumberSelectedLengthValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
}

export type NumberLengthValidationOptions = {
  customVal: number | null
  selectedLengthValidation: NumberSelectedLengthValidation | '' | null
}

export type NumberRangeValidationOptions = {
  rangeMinimum: number | null
  rangeMaximum: number | null
}

export type NumberValidationOptions = {
  selectedValidation: NumberSelectedValidation | null
  LengthValidationOptions: NumberLengthValidationOptions
  RangeValidationOptions: NumberRangeValidationOptions
}

export interface NumberFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Number
  ValidationOptions: NumberValidationOptions
}
