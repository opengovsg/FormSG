import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField } from 'formsg-shared/types'
import { isCanonicalTime } from 'formsg-shared/utils/time-validation'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

/**
 * A Time field's answer is validated against the canonical persisted form only —
 * 24-hour, zero-padded `HH:MM:SS`.
 *
 * Note what is deliberately *not* checked: the field's `includeSeconds` and
 * `use24HourFormat` settings. Those govern the input widget, not the data. The
 * widget normalises before submitting, so by the time an answer arrives the
 * settings have already done their job and a stored answer carries no trace of
 * which ones were in force. Validating against them here would couple storage
 * to presentation and mean that flipping a toggle retroactively invalidated
 * existing submissions.
 *
 * The cost is that a hand-crafted submission could supply a non-zero seconds
 * component to a field that does not collect seconds. That yields a valid,
 * canonical time carrying more precision than was asked for — accepted as
 * strictly better than the coupling.
 */
type TimeValidator = ResponseValidator<ProcessedSingleAnswerResponse>

const timeFormatValidator: TimeValidator = (response) => {
  return isCanonicalTime(response.answer)
    ? right(response)
    : left(`TimeValidator:\t answer is not a valid time`)
}

export const constructTimeValidator = (): TimeValidator =>
  flow(notEmptySingleAnswerResponse, chain(timeFormatValidator))

// V4

type TimeResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Time
  answer: StringAnswerV4
}

const isTimeResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  TimeResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Time) {
    return left(`TimeValidatorV4.fieldTypeMismatch:\tfieldType is not time`)
  }
  return right(response as TimeResponseV4)
}

const notEmptyTimeAnswerV4: ResponseValidator<TimeResponseV4> = (response) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'TimeValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const timeFormatValidatorV4: ResponseValidator<TimeResponseV4> = (response) => {
  return isCanonicalTime(response.answer.value)
    ? right(response)
    : left(`TimeValidatorV4:\t answer is not a valid time`)
}

export const constructTimeValidatorV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  TimeResponseV4
> = flow(
  isTimeResponseV4,
  chain(notEmptyTimeAnswerV4),
  chain(timeFormatValidatorV4),
)
