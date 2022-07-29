import { format } from 'date-fns'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import moment from 'moment-timezone'

import {
  DateSelectedValidation,
  InvalidDaysOptions,
} from '../../../../../shared/types'
import {
  IDateFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
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
 * Returns the number representation of a day of the week
 */
const convertInvalidDayToNumber = (invalidDay: InvalidDaysOptions): number => {
  switch (invalidDay) {
    case InvalidDaysOptions.Sunday:
      return 0
    case InvalidDaysOptions.Monday:
      return 1
    case InvalidDaysOptions.Tuesday:
      return 2
    case InvalidDaysOptions.Wednesday:
      return 3
    case InvalidDaysOptions.Thursday:
      return 4
    case InvalidDaysOptions.Friday:
      return 5
    case InvalidDaysOptions.Saturday:
      return 6
    default:
      return -1
  }
}

/**
 * Convert the days of the week in the invalidDays array
 * to a number array representing the number representation
 * of the corresponding day of the week
 */
const convertInvalidDayOfTheWeekToNumberSet = (
  invalidDays: InvalidDaysOptions[],
): Set<number> => {
  if (invalidDays.length === 0) {
    return new Set()
  }

  const invaliDaysNumberArray = invalidDays.map((invalidDay) =>
    convertInvalidDayToNumber(invalidDay),
  )
  return new Set(invaliDaysNumberArray)
}

const makeInvalidDayOfTheWeekValidator: DateValidatorConstructor =
  (dateField) => (response) => {
    const { answer } = response

    // Convert invalidDays, containing only days of the week, to a Set<number>
    const invalidDaysOfTheWeekSet = convertInvalidDayOfTheWeekToNumberSet(
      dateField.invalidDays ?? [],
    )
    // Convert date response to a ISO day of the week number format
    const dateResponseNumberFormat = parseInt(format(new Date(answer), 'i'))
    // Validate date response
    return invalidDaysOfTheWeekSet.has(dateResponseNumberFormat)
      ? left(`DateValidator:\t answer is an invalid day`)
      : right(response)
  }

const invalidDaysValidator: DateValidatorConstructor = (dateField) => {
  return makeInvalidDayOfTheWeekValidator(dateField)
}

/**
 * Returns a validation function for a date field when called.
 */
export const constructDateValidator: DateValidatorConstructor = (dateField) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(dateFormatValidator),
    chain(makeDateValidator(dateField)),
    chain(invalidDaysValidator(dateField)),
  )
