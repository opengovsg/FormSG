import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export enum RatingShape {
  Heart = 'Heart',
  Star = 'Star',
}

export interface IRatingField extends IField {
  ratingOptions: {
    steps: number
    shape: RatingShape
  }
}

// Manual override since mongoose types don't have generics yet.
export interface IRatingFieldSchema extends IRatingField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
