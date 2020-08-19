import { Document } from 'mongoose'

import { IFormSchema } from '../form'

import { IField, IFieldSchema } from './baseField'
import { BasicField } from './fieldTypes'

export interface IColumn {
  title: string
  required: boolean
  // Allow all BasicFieldTypes, but pre-validate hook will block non-dropdown/
  // non-textfield types.
  columnType: BasicField
}

// Manual override since mongoose types don't have generics yet.
// This is different from the fields since ColumnDocument's parent is the
// TableField.
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

export interface ITableFieldSchema extends ITableField, IFieldSchema {}
