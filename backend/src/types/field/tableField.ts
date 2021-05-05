import { Document } from 'mongoose'

import { IFormSchema } from '../form'

import { IFieldSchema } from './baseField'
import { ITableField as ISharedTableField, IColumn } from './fieldTypes'

export interface IColumnSchema extends IColumn, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}

export interface ITableField extends ISharedTableField {
  columns: IColumnSchema[]
}

export interface ITableFieldSchema extends ITableField, IFieldSchema {}
