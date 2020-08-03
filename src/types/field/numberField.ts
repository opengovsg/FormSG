import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

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

// Manual override since mongoose types don't have generics yet.
export interface INumberFieldSchema extends INumberField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
