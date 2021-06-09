import { IField, IFieldSchema, TextSelectedValidation } from '../baseField'

/**
 * Utility types for short and long text field
 */
export type TextValidationOptions = {
  customVal: number | null
  selectedValidation: TextSelectedValidation | null
}

export interface ITextField extends IField {
  ValidationOptions: TextValidationOptions
}

export interface ITextFieldSchema extends ITextField, IFieldSchema {}
