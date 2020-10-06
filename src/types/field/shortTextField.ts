import { IField, IFieldSchema, TextValidationOptions } from './baseField'

export type ShortTextValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: TextValidationOptions | null
}

export interface IShortTextField extends IField {
  ValidationOptions: ShortTextValidationOptions
}

export interface IShortTextFieldSchema extends IShortTextField, IFieldSchema {}
