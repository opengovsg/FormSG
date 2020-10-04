import { IField, IFieldSchema } from './baseField'

export enum LongTextSelectedValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
  Range = 'Range',
}

export type LongTextValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: LongTextSelectedValidation | null
}

export interface ILongTextField extends IField {
  ValidationOptions: LongTextValidationOptions
}

export interface ILongTextFieldSchema extends ILongTextField, IFieldSchema {}
