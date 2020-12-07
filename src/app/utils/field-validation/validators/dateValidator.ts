import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import moment from 'moment-timezone'

import { IDateField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import { notEmptySingleAnswerResponse } from './common'

type DateValidator = ResponseValidator<ISingleAnswerResponse>
type DateValidatorConstructor = (dateField: IDateField) => DateValidator

/**
 * @param date
 * @returns a moment with the date in the format 'DD MMM YYYY'
 */
export const createMomentFromDateString = (date: string): moment.Moment => {
  const DATE_FORMAT = 'DD MMM YYYY'

  return moment(date, DATE_FORMAT, true)
}

const dateFormatValidator: DateValidator = (response) => {
  const { answer } = response
  return createMomentFromDateString(answer).isValid()
    ? right(response)
    : left(`DateValidator:\t answer is not a valid date`)
}

const makeDateValidator: DateValidatorConstructor = (dateField) => (
  response,
) => {
  const { answer } = response
  const answerDate = createMomentFromDateString(answer)
  const { selectedDateValidation, customMinDate, customMaxDate } =
    dateField.dateValidation || {}

  const isFutureOnly = selectedDateValidation === 'Disallow past dates'
  const isPastOnly = selectedDateValidation === 'Disallow future dates'

  // Today takes two possible values - a min and max, to account for all possible timezones
  const todayMin = moment().utc().subtract(12, 'hours').startOf('day')
  const todayMax = moment().utc().add(14, 'hours').startOf('day')

  return (isFutureOnly && answerDate.isBefore(todayMin)) ||
    (isPastOnly && answerDate.isAfter(todayMax)) ||
    (customMinDate && answerDate.isBefore(customMinDate)) ||
    (customMaxDate && answerDate.isAfter(customMaxDate))
    ? left(`DateValidator:\t answer does not pass date logic validation`)
    : right(response)
}

export const constructDateValidator: DateValidatorConstructor = (dateField) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(dateFormatValidator),
    chain(makeDateValidator(dateField)),
  )
