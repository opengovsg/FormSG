import { BasicField, MyInfoableFieldBase } from './base'

// Enum of date validation options
export enum DateSelectedValidation {
  NoPast = 'Disallow past dates',
  NoFuture = 'Disallow future dates',
  Custom = 'Custom date range',
}

export enum InvalidDaysOptions {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
}

export type DateValidationOptions = {
  customMaxDate: Date | null
  customMinDate: Date | null
  selectedDateValidation: DateSelectedValidation | null
}

export interface DateFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Date
  dateValidation: DateValidationOptions
  invalidDays?: InvalidDaysOptions[]
}
