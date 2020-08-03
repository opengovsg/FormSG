import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export interface IRadioField extends IField {
  fieldOptions: string[]
  othersRadioButton: boolean
}

// Manual override since mongoose types don't have generics yet.
export interface IRadioFieldSchema extends IRadioField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
