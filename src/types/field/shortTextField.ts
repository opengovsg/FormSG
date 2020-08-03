import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

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

// Manual override since mongoose types don't have generics yet.
export interface IShortTextFieldSchema extends IShortTextField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
