import { IField, IFieldSchema } from './baseField'

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

export interface ICheckboxFieldSchema extends ICheckboxField, IFieldSchema {}
