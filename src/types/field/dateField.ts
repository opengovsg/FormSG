import { DateSelectedValidation } from '../../shared/constants'

import { IField, IFieldSchema } from './baseField'

export type DateValidationOptions = {
  customMaxDate: Date | null
  customMinDate: Date | null
  selectedDateValidation: DateSelectedValidation | null
}

export interface IDateField extends IField {
  dateValidation: DateValidationOptions
}

export interface IDateFieldSchema extends IDateField, IFieldSchema {}
