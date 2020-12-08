import { IField, IFieldSchema } from './baseField'

export type DecimalValidationOptions = {
  customMax: number | null
  customMin: number | null
}

export interface IDecimalField extends IField {
  ValidationOptions: DecimalValidationOptions
  validateByValue: boolean
}

export interface IDecimalFieldSchema extends IDecimalField, IFieldSchema {}
