import { IField, IFieldSchema, TextSelectedValidation } from './baseField'

export type ShortTextValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: TextSelectedValidation | null
}

export interface IShortTextField extends IField {
  ValidationOptions: ShortTextValidationOptions
}

export interface IShortTextFieldSchema extends IShortTextField, IFieldSchema {
  // Prefill flag
  allowPrefill?: boolean
}
