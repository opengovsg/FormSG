import { format } from 'date-fns'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import moment from 'moment-timezone'

import { ParsedClearFormFieldResponseV3 } from 'src/types/api'

import {
  BasicField,
  DateResponseV3,
  DateSelectedValidation,
} from '../../../../../shared/types'
import { convertInvalidDaysOfTheWeekToNumberSet as convertInvalidDaysToNumberSet } from '../../../../../shared/utils/date-validation'
import {
  IDateFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'

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

const isDateResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  DateResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Date) {
    return left(`DateValidatorV3.fieldTypeMismatch:\tfieldType is not date`)
  }
  return right(response)
}

/**
 * @param date
 * @returns a moment with the date in the format 'DD/MM/YYYY'
 */
const createMomentFromDateStringV3 = (date: string): moment.Moment => {
  const DATE_FORMAT = 'DD/MM/YYYY'

  return moment(date, DATE_FORMAT, true)
}

/**
 * Return a validator to check if date format is correct.
 */
const dateFormatValidatorV3: ResponseValidator<DateResponseV3> = (response) => {
  const { answer } = response
  return createMomentFromDateStringV3(answer).isValid()
    ? right(response)
    : left(`DateValidatorV3:\t answer is not a valid date`)
}

/**
 * Returns a validator to check if date is in the future.
 */
const pastOnlyValidatorV3: ResponseValidator<DateResponseV3> = (response) => {
  // Today takes two possible values - a min (in makeFutureOnlyValidator) and max (here)
  // Add 14 hours here to account for up to UTC + 14 timezone
  // This allows validation to pass as long as user is on the correct date (locally)
  // Even if they are in a different timezone
  const todayMax = moment().utc().add(14, 'hours').startOf('day')
  const { answer } = response
  const answerDate = createMomentFromDateStringV3(answer)

  return answerDate.isAfter(todayMax)
    ? left(
        `DateValidatorV3:\t answer does not pass past only date logic validation`,
      )
    : right(response)
}

/**
 * Returns a validator to check if date is in the past.
 */
const futureOnlyValidatorV3: ResponseValidator<DateResponseV3> = (response) => {
  // Today takes two possible values - a min (here) and max (in makePastOnlyValidator)
  // Subtract 12 hours here to account for up to UTC - 12 timezone
  // This allows validation to pass as long as user is on the correct date (locally)
  // Even if they are in a different timezone
  const todayMin = moment().utc().subtract(12, 'hours').startOf('day')
  const { answer } = response
  const answerDate = createMomentFromDateStringV3(answer)

  return answerDate.isBefore(todayMin)
    ? left(
        `DateValidatorV3:\t answer does not pass future only date logic validation`,
      )
    : right(response)
}

/**
 * Returns a validator to check if date is within the
 * specified custom date range.
 */
const makeCustomDateValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  DateResponseV3
> = (dateField) => (response) => {
  const { answer } = response
  const answerDate = createMomentFromDateStringV3(answer)

  const { customMinDate, customMaxDate } = dateField.dateValidation || {}

  return (customMinDate && answerDate.isBefore(customMinDate)) ||
    (customMaxDate && answerDate.isAfter(customMaxDate))
    ? left(
        `DateValidatorV3:\t answer does not pass custom date logic validation`,
      )
    : right(response)
}

/**
 * Returns the appropriate validator
 * based on the date validation option selected.
 */
const makeDateValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  DateResponseV3
> = (dateField) => {
  const { selectedDateValidation } = dateField.dateValidation || {}
  switch (selectedDateValidation) {
    case DateSelectedValidation.NoFuture:
      return pastOnlyValidatorV3
    case DateSelectedValidation.NoPast:
      return futureOnlyValidatorV3
    case DateSelectedValidation.Custom:
      return makeCustomDateValidatorV3(dateField)
    default:
      return right
  }
}

/**
 * Returns a validator to check if date is an invalid day
 */
const makeInvalidDaysValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  DateResponseV3
> = (dateField) => (response) => {
  const { answer } = response
  const invalidDays = convertInvalidDaysToNumberSet(dateField.invalidDays ?? [])

  const dayOfWeekNumber = createMomentFromDateStringV3(answer).isoWeekday()

  return invalidDays.has(dayOfWeekNumber)
    ? left(`DateValidatorV3:\t answer is an invalid day`)
    : right(response)
}

export const constructDateValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDateFieldSchema>,
  ParsedClearFormFieldResponseV3,
  DateResponseV3
> = (dateField) => {
  return flow(
    isDateResponseV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(dateFormatValidatorV3),
    chain(makeDateValidatorV3(dateField)),
    chain(makeInvalidDaysValidatorV3(dateField)),
  )
}
