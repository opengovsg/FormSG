import { IField, IFieldSchema } from './baseField'

export enum NumberSelectedValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
  Range = 'Range',
}

export type NumberValidationOptions = {
  customMax: number
  customMin: number
  customVal: number
  selectedValidation: NumberSelectedValidation | null
}

export interface INumberField extends IField {
  ValidationOptions: NumberValidationOptions
}

export interface INumberFieldSchema extends INumberField, IFieldSchema {}
