import { IField, IFieldSchema, TextValidationOptions } from './baseField'

export type LongTextValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: TextValidationOptions | null
}

export interface ILongTextField extends IField {
  ValidationOptions: LongTextValidationOptions
}

export interface ILongTextFieldSchema extends ILongTextField, IFieldSchema {}
