import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'

export type CheckboxValidationOptions = {
  customMax: number
  customMin: number
}

export interface ICheckboxField extends IField {
  fieldOptions: string[]
  othersRadioButton: boolean
  ValidationOptions: CheckboxValidationOptions
  validateByValue: boolean
}

// Manual override since mongoose types don't have generics yet.
export interface ICheckboxFieldSchema extends ICheckboxField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
