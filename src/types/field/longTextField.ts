import { IField, IFieldSchema, TextSelectedValidation } from './baseField'

export type LongTextValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: TextSelectedValidation | null
}

export interface ILongTextField extends IField {
  ValidationOptions: LongTextValidationOptions
}

export interface ILongTextFieldSchema extends ILongTextField, IFieldSchema {}
