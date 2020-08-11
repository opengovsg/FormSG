import { IField, IFieldSchema } from './baseField'

export enum ShortTextSelectedValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
  Range = 'Range',
}

export type ShortTextValidationOptions = {
  customMax: number
  customMin: number
  customVal: number
  selectedValidation: ShortTextSelectedValidation | null
}

export interface IShortTextField extends IField {
  ValidationOptions: ShortTextValidationOptions
}

export interface IShortTextFieldSchema extends IShortTextField, IFieldSchema {}
