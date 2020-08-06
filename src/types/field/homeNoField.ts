import { IField, IFieldSchema } from './baseField'

export interface IHomenoField extends IField {
  allowIntlNumbers: boolean
}

export interface IHomenoFieldSchema extends IHomenoField, IFieldSchema {}
