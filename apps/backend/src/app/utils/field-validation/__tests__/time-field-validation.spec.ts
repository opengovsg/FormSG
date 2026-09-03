import { BasicField } from 'formsg-shared/types'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'
import { validateField, validateFieldV4 } from '..'

/**
 * A Time field's answer is validated against the canonical persisted form only.
 * The field's display settings deliberately do not participate — see the note
 * in timeValidator.ts.
 */
const makeField = (overrides = {}) =>
  ({
    _id: 'abc123',
    fieldType: BasicField.Time,
    title: 'What time?',
    required: true,
    disabled: false,
    includeSeconds: false,
    use24HourFormat: true,
    ...overrides,
  }) as never

const makeResponse = (answer: string): ProcessedSingleAnswerResponse =>
  ({
    _id: 'abc123',
    fieldType: BasicField.Time,
    question: 'What time?',
    answer,
    isVisible: true,
  }) as ProcessedSingleAnswerResponse

describe('Time field validation', () => {
  it.each(['00:00:00', '09:30:00', '14:30:15', '23:59:59'])(
    'should accept the canonical time %s',
    (answer) => {
      const result = validateField('formId', makeField(), makeResponse(answer))
      expect(result._unsafeUnwrap()).toEqual(true)
    },
  )

  it.each([
    ['09:30', 'missing seconds — the widget always sends full precision'],
    ['9:30:00', 'unpadded hour'],
    ['24:00:00', 'hour out of range'],
    ['23:60:00', 'minute out of range'],
    ['02:30:00 PM', 'meridiem suffix'],
    ['not a time', 'nonsense'],
  ])('should reject %j (%s)', (answer) => {
    const result = validateField('formId', makeField(), makeResponse(answer))
    expect(result.isErr()).toEqual(true)
  })

  it('should reject an empty answer on a required field', () => {
    const result = validateField('formId', makeField(), makeResponse(''))
    expect(result.isErr()).toEqual(true)
  })

  it('should accept the same answer regardless of the display settings', () => {
    // The settings govern the widget, not the data. A stored answer carries no
    // trace of which ones were in force, so validation must not consult them.
    const answer = makeResponse('14:30:15')
    for (const includeSeconds of [true, false]) {
      for (const use24HourFormat of [true, false]) {
        const result = validateField(
          'formId',
          makeField({ includeSeconds, use24HourFormat }),
          answer,
        )
        expect(result._unsafeUnwrap()).toEqual(true)
      }
    }
  })
})

/**
 * The V4 submission path is what the public form actually posts to, and it
 * routes a Time answer through a separate list of "generic string" field
 * types. A response missing from that list falls through every switch in
 * `validateFieldV4` and is rejected as having an invalid shape — so a valid
 * time was failing submission with no indication of which field was at fault.
 */
describe('Time field validation V4', () => {
  const makeResponseV4 = (value: string): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.Time,
      question: 'What time?',
      answer: { value },
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  const validate = (value: string, isVisible = true) =>
    validateFieldV4({
      formId: 'formId',
      formField: makeField(),
      response: makeResponseV4(value),
      isVisible,
    })

  it.each(['00:00:00', '09:30:00', '11:11:11', '14:30:15', '23:59:59'])(
    'should accept the canonical time %s',
    (value) => {
      expect(validate(value)._unsafeUnwrap()).toEqual(true)
    },
  )

  it.each([
    ['14:30', 'no seconds'],
    ['24:00:00', 'hour out of range'],
    ['02:30:00 PM', 'meridiem suffix'],
    ['1430', 'unseparated digits, as an unfinished entry reports'],
    ['not a time', 'nonsense'],
  ])('should reject %j (%s)', (value) => {
    expect(validate(value).isErr()).toEqual(true)
  })

  it('should reject an empty answer on a required field', () => {
    expect(validate('').isErr()).toEqual(true)
  })

  it('should reject an answer submitted on a hidden field', () => {
    expect(validate('14:30:00', false).isErr()).toEqual(true)
  })
})
