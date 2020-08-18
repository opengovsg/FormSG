import { IField, IFieldSchema } from './baseField'

export type DecimalValidationOptions = {
  customMax: number
  customMin: number
}

export interface IDecimalField extends IField {
  ValidationOptions: DecimalValidationOptions
  validateByValue: boolean
}

export interface IDecimalFieldSchema extends IDecimalField, IFieldSchema {}
