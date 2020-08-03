import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export interface IImageField extends IField {
  url: string
  fileMd5Hash: string
  name: string
  size: string
}

// Manual override since mongoose types don't have generics yet.
export interface IImageFieldSchema extends IImageField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
