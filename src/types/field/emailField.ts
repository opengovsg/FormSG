import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export type AutoReplyOptions = {
  hasAutoReply: boolean
  autoReplySubject: string
  autoReplySender: string
  autoReplyMessage: string
  includeFormSummary: boolean
}

export interface IEmailField extends IField {
  autoReplyOptions: AutoReplyOptions
  isVerifiable: boolean
}

// Manual override since mongoose types don't have generics yet.
export interface IEmailFieldSchema extends IEmailField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
