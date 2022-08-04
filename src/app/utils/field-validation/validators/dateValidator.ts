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

const DAY_TO_NUMBER_MAP: Record<InvalidDaysOptions, number> = {
  [InvalidDaysOptions.Monday]: 1,
  [InvalidDaysOptions.Tuesday]: 2,
  [InvalidDaysOptions.Wednesday]: 3,
  [InvalidDaysOptions.Thursday]: 4,
  [InvalidDaysOptions.Friday]: 5,
  [InvalidDaysOptions.Saturday]: 6,
  [InvalidDaysOptions.Sunday]: 7,
}

/**
 * Convert the days of the week in the invalidDays array
 * to a number array representing the number representation
 * of the corresponding day of the week
 */
const convertInvalidDaysOfTheWeekToNumberSet = (
  invalidDays: InvalidDaysOptions[],
): Set<number> => {
  if (invalidDays.length === 0) {
    return new Set()
  }

  return new Set(invalidDays.map((invalidDay) => DAY_TO_NUMBER_MAP[invalidDay]))
}

/**
 * Returns a validator to check if date is an invalid day of the week.
 */
const makeInvalidDayOfTheWeekValidator: DateValidatorConstructor =
  (dateField) => (response) => {
    const { answer } = response

    const invalidDaysOfTheWeekSet = convertInvalidDaysOfTheWeekToNumberSet(
      dateField.invalidDays ?? [],
    )

    // Convert date response to a ISO day of the week number format
    const dateResponseNumberFormat = parseInt(format(new Date(answer), 'i'))

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
