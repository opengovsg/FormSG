import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export interface IDropdownField extends IField {
  fieldOptions: string[]
}

// Manual override since mongoose types don't have generics yet.
export interface IDropdownFieldSchema extends IDropdownField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
