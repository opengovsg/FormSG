import { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import { describe, expect, it } from 'vitest'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { flattenV4ToFormFields } from './flattenV4ToFormFields'

/**
 * A Time answer must reach the CSV pipeline as the canonical string it was
 * stored as. It is a plain string field, so it should take the generic
 * string-field path rather than the switch's unknown-type fallthrough — the two
 * happen to behave the same today, which is exactly why a regression here would
 * be silent.
 */
const timeField = {
  _id: 'time-field-id',
  title: 'Appointment time',
  fieldType: BasicField.Time,
  required: true,
  disabled: false,
  description: '',
  includeSeconds: false,
  use24HourFormat: true,
} as unknown as FormFieldDto

describe('flattenV4ToFormFields — Time', () => {
  it('should carry the canonical answer straight through', () => {
    const v4Responses = {
      'time-field-id': {
        fieldType: BasicField.Time,
        question: 'Appointment time',
        answer: { value: '14:30:00' },
      },
    } as unknown as FieldResponsesV4

    const result = flattenV4ToFormFields({
      v4Responses,
      formFields: [timeField],
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      _id: 'time-field-id',
      fieldType: BasicField.Time,
      answer: '14:30:00',
    })
  })

  it('should keep seconds when the field collects them', () => {
    const v4Responses = {
      'time-field-id': {
        fieldType: BasicField.Time,
        question: 'Appointment time',
        answer: { value: '09:05:42' },
      },
    } as unknown as FieldResponsesV4

    const result = flattenV4ToFormFields({
      v4Responses,
      formFields: [{ ...timeField, includeSeconds: true } as FormFieldDto],
    })

    expect(result[0]).toMatchObject({ answer: '09:05:42' })
  })

  it('should emit an empty answer for an unanswered field', () => {
    const result = flattenV4ToFormFields({
      v4Responses: {} as FieldResponsesV4,
      formFields: [timeField],
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ answer: '' })
  })
})
