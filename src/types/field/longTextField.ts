import { IField, IFieldSchema } from './baseField'

export enum LongTextSelectedValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
  Range = 'Range',
}

export type LongTextValidationOptions = {
  customMax: number
  customMin: number
  customVal: number
  selectedValidation: LongTextSelectedValidation | null
}

export interface ILongTextField extends IField {
  ValidationOptions: LongTextValidationOptions
}

export interface ILongTextFieldSchema extends ILongTextField, IFieldSchema {}
