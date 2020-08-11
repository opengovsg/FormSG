import { IField, IFieldSchema } from './baseField'

export enum DateSelectedValidation {
  NoPast = 'Disallow past dates',
  NoFuture = 'Disallow future dates',
  Custom = 'Custom date range',
}

export type DateValidationOptions = {
  customMaxDate: Date | null
  customMinDate: Date | null
  selectedDateValidation: DateSelectedValidation | null
}

export interface IDateField extends IField {
  isFutureOnly: boolean
  dateValidation: DateValidationOptions
}

export interface IDateFieldSchema extends IDateField, IFieldSchema {}
