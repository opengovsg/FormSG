import { IField, IFieldSchema } from './baseField'

export enum NumberSelectedValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
}

export enum NumberValidationType {
  Length = 'Length',
  Value = 'Value',
}

export type NumberValidationOptions = {
  customVal: number | null
  rangeMin: number | null
  rangeMax: number | null
  selectedValidationType: NumberValidationType | null
  selectedValidation: NumberSelectedValidation | null
}

export interface INumberField extends IField {
  ValidationOptions: NumberValidationOptions
}

export interface INumberFieldSchema extends INumberField, IFieldSchema {}
