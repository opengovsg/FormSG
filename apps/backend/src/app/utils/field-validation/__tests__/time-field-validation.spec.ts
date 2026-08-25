import { BasicField } from 'formsg-shared/types'

import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'
import { validateField } from '..'

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
