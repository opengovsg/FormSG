import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

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

// Manual override since mongoose types don't have generics yet.
export interface ILongTextFieldSchema extends ILongTextField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
