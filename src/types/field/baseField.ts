import { Document } from 'mongoose'

import { IFormSchema } from '../form'
import { BasicFieldType, MyInfoAttribute } from './fieldTypes'

export interface IMyInfo {
  attr: MyInfoAttribute
}

export interface IMyInfoSchema extends IMyInfo, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFieldSchema
}

export interface IField {
  globalId: string
  title: string
  description: string
  required: boolean
  disabled: boolean
  fieldType: BasicFieldType
  myInfo?: IMyInfo
  _id: Document['_id']
}

// Manual override since mongoose types don't have generics yet.
export interface IFieldSchema extends IField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}

export interface IClientFieldSchema extends IFieldSchema {
  fieldValue: string
}
