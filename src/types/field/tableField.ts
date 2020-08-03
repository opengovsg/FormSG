import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { IField } from './baseField'
import { BasicFieldType } from './fieldTypes'

export interface IColumn {
  title: string
  required: boolean
  // Allow all BasicFieldTypes, but pre-validate hook will block non-dropdown/
  // non-textfield types.
  columnType: BasicFieldType
}

// Manual override since mongoose types don't have generics yet.
export interface IColumnSchema extends IColumn, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): ITableFieldSchema
}

export interface ITableField extends IField {
  minimumRows: number
  addMoreRows?: boolean
  maximumRows?: number
  columns: IColumn[]
}

// Manual override since mongoose types don't have generics yet.
export interface ITableFieldSchema extends ITableField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}
