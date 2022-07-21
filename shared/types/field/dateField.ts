import { BasicField, MyInfoableFieldBase } from './base'

// Enum of date validation options
export enum DateSelectedValidation {
  NoPast = 'Disallow past dates',
  NoFuture = 'Disallow future dates',
  Custom = 'Custom date range',
}

export enum DaysOfTheWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export type DateValidationOptions = {
  customMaxDate: Date | null
  customMinDate: Date | null
  selectedDateValidation: DateSelectedValidation | null
}

export interface DateFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Date
  dateValidation: DateValidationOptions
  invalidDaysOfTheWeek?: DaysOfTheWeek[] | null
}
