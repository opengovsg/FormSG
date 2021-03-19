import { Document } from 'mongoose'

import { IFormSchema } from '../form'

import { IField, IFieldSchema } from './baseField'
import { BasicField } from './fieldTypes'

export interface IColumn {
  title: string
  required: boolean
  // Pre-validate hook will block non-dropdown/
  // non-textfield types.
  columnType: BasicField.ShortText | BasicField.Dropdown
}
export interface IColumnSchema extends IColumn, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}

export interface ITableField extends IField {
  minimumRows: number
  addMoreRows?: boolean
  maximumRows?: number
  columns: IColumnSchema[]
}

export interface ITableFieldSchema extends ITableField, IFieldSchema {}
