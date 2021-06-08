import { IField, IFieldSchema } from './baseField'

export enum NumberSelectedValidation {
  Max = 'Maximum Length',
  Min = 'Minimum Length',
  Exact = 'Exact Length',
  Range = 'Range',
}

export type NumberValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  rangeMin: number | null
  rangeMax: number | null
  selectedValidation: NumberSelectedValidation | null
}

export interface INumberField extends IField {
  ValidationOptions: NumberValidationOptions
}

export interface INumberFieldSchema extends INumberField, IFieldSchema {}
