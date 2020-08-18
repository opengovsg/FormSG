import { IField, IFieldSchema } from './baseField'

export interface IRadioField extends IField {
  fieldOptions: string[]
  othersRadioButton: boolean
}

export interface IRadioFieldSchema extends IRadioField, IFieldSchema {}
