import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import { format } from 'date-fns'
import { BasicField, DateSelectedValidation } from 'formsg-shared/types'
import { convertInvalidDaysOfTheWeekToNumberSet as convertInvalidDaysToNumberSet } from 'formsg-shared/utils/date-validation'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import moment from 'moment-timezone'

import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

import {
  IDateFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

type DateValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type DateValidatorConstructor = (
  dateField: OmitUnusedValidatorProps<IDateFieldSchema>,
) => DateValidator

/**
 * @param date
 * @returns a moment with the date in the format 'DD MMM YYYY'
 */
const createMomentFromDateString = (date: string): moment.Moment => {
  const DATE_FORMAT = 'DD MMM YYYY'

  return moment(date, DATE_FORMAT, true)
}

/**
 * Return a validator to check if date format is correct.
 */
const dateFormatValidator: DateValidator = (response) => {
  const { answer } = response
  return createMomentFromDateString(answer).isValid()
    ? right(response)
    : left(`DateValidator:\t answer is not a valid date`)
}

/**
 * Returns a validator to check if date is in the future.
 */
const pastOnlyValidator: DateValidator = (response) => {
  // Today takes two possible values - a min (in makeFutureOnlyValidator) and max (here)
  // Add 14 hours here to account for up to UTC + 14 timezone
  // This allows validation to pass as long as user is on the correct date (locally)
  // Even if they are in a different timezone
  const todayMax = moment().utc().add(14, 'hours').startOf('day')
  const { answer } = response
  const answerDate = createMomentFromDateString(answer)

  return answerDate.isAfter(todayMax)
    ? left(`DateValidator:\t answer does not pass date logic validation`)
    : right(response)
}

/**
 * Returns a validator to check if date is in the past.
 */
const futureOnlyValidator: DateValidator = (response) => {
  // Today takes two possible values - a min (here) and max (in makePastOnlyValidator)
  // Subtract 12 hours here to account for up to UTC - 12 timezone
  // This allows validation to pass as long as user is on the correct date (locally)
  // Even if they are in a different timezone
  const todayMin = moment().utc().subtract(12, 'hours').startOf('day')
  const { answer } = response
  const answerDate = createMomentFromDateString(answer)

  return answerDate.isBefore(todayMin)
    ? left(`DateValidator:\t answer does not pass date logic validation`)
    : right(response)
}

/**
 * Returns a validator to check if date is within the
 * specified custom date range.
 */
const makeCustomDateValidator: DateValidatorConstructor =
  (dateField) => (response) => {
    const { answer } = response
    const answerDate = createMomentFromDateString(answer)

    const { customMinDate, customMaxDate } = dateField.dateValidation || {}

    return (customMinDate && answerDate.isBefore(customMinDate)) ||
      (customMaxDate && answerDate.isAfter(customMaxDate))
      ? left(`DateValidator:\t answer does not pass date logic validation`)
      : right(response)
  }

/**
 * Returns the appropriate validator
 * based on the date validation option selected.
 */
const makeDateValidator: DateValidatorConstructor = (dateField) => {
  const { selectedDateValidation } = dateField.dateValidation || {}
  switch (selectedDateValidation) {
    case DateSelectedValidation.NoFuture:
      return pastOnlyValidator
    case DateSelectedValidation.NoPast:
      return futureOnlyValidator
    case DateSelectedValidation.Custom:
      return makeCustomDateValidator(dateField)
    default:
      return right
  }
}

/**
 * Returns a validator to check if date is an invalid day
 */
const makeInvalidDaysValidator: DateValidatorConstructor =
  (dateField) => (response) => {
    const { answer } = response
    const invalidDays = convertInvalidDaysToNumberSet(
      dateField.invalidDays ?? [],
    )
    // Convert date response to a ISO day of the week number format
    const dateResponseNumberFormat = parseInt(format(new Date(answer), 'i'))

    return invalidDays.has(dateResponseNumberFormat)
      ? left(`DateValidator:\t answer is an invalid day`)
      : right(response)
  }

/**
 * Returns a validation function for a date field when called.
 */
export const constructDateValidator: DateValidatorConstructor = (dateField) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(dateFormatValidator),
    chain(makeDateValidator(dateField)),
    chain(makeInvalidDaysValidator(dateField)),
  )

/**
 * @param date
 * @returns a moment with the date in the format 'DD/MM/YYYY'
 */
const createMomentFromDateStringV3 = (date: string): moment.Moment => {
  const DATE_FORMAT = 'DD/MM/YYYY'

  return moment(date, DATE_FORMAT, true)
}

// V4
// V4 date: answer = { value: string } where value is in 'DD/MM/YYYY' format

type DateResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Date
  answer: StringAnswerV4
}

const isDateResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  DateResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Date) {
    return left(`DateValidatorV4.fieldTypeMismatch:\tfieldType is not date`)
  }
  return right(response as DateResponseV4)
}

const notEmptyDateAnswerV4: ResponseValidator<DateResponseV4> = (response) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'DateValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const dateFormatValidatorV4: ResponseValidator<DateResponseV4> = (response) => {
  const { value } = response.answer
  return createMomentFromDateStringV3(value).isValid()
    ? right(response)
    : left(`DateValidatorV4:\t answer is not a valid date`)
}

const pastOnlyValidatorV4: ResponseValidator<DateResponseV4> = (response) => {
  const todayMax = moment().utc().add(14, 'hours').startOf('day')
  const answerDate = createMomentFromDateStringV3(response.answer.value)

  return answerDate.isAfter(todayMax)
    ? left(
        `DateValidatorV4:\t answer does not pass past only date logic validation`,
      )
    : right(response)
}

const futureOnlyValidatorV4: ResponseValidator<DateResponseV4> = (response) => {
  const todayMin = moment().utc().subtract(12, 'hours').startOf('day')
  const answerDate = createMomentFromDateStringV3(response.answer.value)

  return answerDate.isBefore(todayMin)
    ? left(
        `DateValidatorV4:\t answer does not pass future only date logic validation`,
      )
    : right(response)
}

const makeCustomDateValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  DateResponseV4
> = (dateField) => (response) => {
  const answerDate = createMomentFromDateStringV3(response.answer.value)
  const { customMinDate, customMaxDate } = dateField.dateValidation || {}

  return (customMinDate && answerDate.isBefore(customMinDate)) ||
    (customMaxDate && answerDate.isAfter(customMaxDate))
    ? left(
        `DateValidatorV4:\t answer does not pass custom date logic validation`,
      )
    : right(response)
}

const makeDateValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  DateResponseV4
> = (dateField) => {
  const { selectedDateValidation } = dateField.dateValidation || {}
  switch (selectedDateValidation) {
    case DateSelectedValidation.NoFuture:
      return pastOnlyValidatorV4
    case DateSelectedValidation.NoPast:
      return futureOnlyValidatorV4
    case DateSelectedValidation.Custom:
      return makeCustomDateValidatorV4(dateField)
    default:
      return right
  }
}

const makeInvalidDaysValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  DateResponseV4
> = (dateField) => (response) => {
  const { value } = response.answer
  const invalidDays = convertInvalidDaysToNumberSet(dateField.invalidDays ?? [])
  const dayOfWeekNumber = createMomentFromDateStringV3(value).isoWeekday()

  return invalidDays.has(dayOfWeekNumber)
    ? left(`DateValidatorV4:\t answer is an invalid day`)
    : right(response)
}

export const constructDateValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  ParsedClearFormFieldResponseV4,
  DateResponseV4
> = (dateField) => {
  return flow(
    isDateResponseV4,
    chain(notEmptyDateAnswerV4),
    chain(dateFormatValidatorV4),
    chain(makeDateValidatorV4(dateField)),
    chain(makeInvalidDaysValidatorV4(dateField)),
  )
}
