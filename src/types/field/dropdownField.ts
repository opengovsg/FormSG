import { IField, IFieldSchema } from './baseField'

export interface IDropdownField extends IField {
  fieldOptions: string[]
}

export interface IDropdownFieldSchema extends IDropdownField, IFieldSchema {}
