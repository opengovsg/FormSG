import { IField, IFieldSchema } from './baseField'

export enum NumberSelectedValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
}

export type NumberValidationOptions = {
  customVal: number | null
  selectedValidation: NumberSelectedValidation | null
}

export interface INumberField extends IField {
  ValidationOptions: NumberValidationOptions
}

export interface INumberFieldSchema extends INumberField, IFieldSchema {}
