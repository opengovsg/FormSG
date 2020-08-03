import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export type DecimalValidationOptions = {
  customMax: number
  customMin: number
}

export interface IDecimalField extends IField {
  ValidationOptions: DecimalValidationOptions
  validateByValue: boolean
}

// Manual override since mongoose types don't have generics yet.
export interface IDecimalFieldSchema extends IDecimalField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
