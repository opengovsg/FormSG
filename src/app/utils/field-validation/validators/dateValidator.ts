import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import moment from 'moment-timezone'

import { IDateField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import { DateSelectedValidation } from '../../../../shared/constants'

import { notEmptySingleAnswerResponse } from './common'

type DateValidator = ResponseValidator<ISingleAnswerResponse>
type DateValidatorConstructor = (dateField: IDateField) => DateValidator

/**
 * @param date
 * @returns a moment with the date in the format 'DD MMM YYYY'
 */
const createMomentFromDateString = (date: string): moment.Moment => {
  const DATE_FORMAT = 'DD MMM YYYY'

  return moment(date, DATE_FORMAT, true)
}

const dateFormatValidator: DateValidator = (response) => {
  const { answer } = response
  return createMomentFromDateString(answer).isValid()
    ? right(response)
    : left(`DateValidator:\t answer is not a valid date`)
}

const pastOnlyValidator: DateValidator = (response) => {
  // Today takes two possible values - a min (in makeFutureOnlyValidator) and max (here), to account for all possible timezones
  const todayMax = moment().utc().add(14, 'hours').startOf('day')
  const { answer } = response
  const answerDate = createMomentFromDateString(answer)

  return answerDate.isAfter(todayMax)
    ? left(`DateValidator:\t answer does not pass date logic validation`)
    : right(response)
}

const futureOnlyValidator: DateValidator = (response) => {
  // Today takes two possible values - a min (here) and max (in makePastOnlyValidator), to account for all possible timezones
  const todayMin = moment().utc().subtract(12, 'hours').startOf('day')
  const { answer } = response
  const answerDate = createMomentFromDateString(answer)

  return answerDate.isBefore(todayMin)
    ? left(`DateValidator:\t answer does not pass date logic validation`)
    : right(response)
}

const makeCustomDateValidator: DateValidatorConstructor = (dateField) => (
  response,
) => {
  const { answer } = response
  const answerDate = createMomentFromDateString(answer)

  const { customMinDate, customMaxDate } = dateField.dateValidation || {}

  return (customMinDate && answerDate.isBefore(customMinDate)) ||
    (customMaxDate && answerDate.isAfter(customMaxDate))
    ? left(`DateValidator:\t answer does not pass date logic validation`)
    : right(response)
}

const makeDateValidator: DateValidatorConstructor = (dateField) => (
  response,
) => {
  const { selectedDateValidation } = dateField.dateValidation || {}
  switch (selectedDateValidation) {
    case DateSelectedValidation.NoFuture:
      return pastOnlyValidator(response)
    case DateSelectedValidation.NoPast:
      return futureOnlyValidator(response)
    case DateSelectedValidation.Custom:
      return makeCustomDateValidator(dateField)(response)
  }
  return right(response)
}

export const constructDateValidator: DateValidatorConstructor = (dateField) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(dateFormatValidator),
    chain(makeDateValidator(dateField)),
  )
