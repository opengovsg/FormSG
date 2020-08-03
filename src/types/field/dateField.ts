import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export enum DateSelectedValidation {
  NoPast = 'Disallow past dates',
  NoFuture = 'Disallow future dates',
  Custom = 'Custom date range',
}

export type DateValidationOptions = {
  customMaxDate: Date | null
  customMinDate: Date | null
  selectedDateValidation: DateSelectedValidation | null
}

export interface IDateField extends IField {
  isFutureOnly: boolean
  dateValidation: DateValidationOptions
}

// Manual override since mongoose types don't have generics yet.
export interface IDateFieldSchema extends IDateField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
