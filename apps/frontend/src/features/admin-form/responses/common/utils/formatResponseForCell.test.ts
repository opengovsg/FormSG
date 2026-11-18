import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { describe, expect, it } from 'vitest'

import { BasicField } from 'formsg-shared/types'

import {
  formatResponseForCell,
  isDescribedFieldType,
} from './formatResponseForCell'

const field = (partial: Partial<FormField>): FormField =>
  ({
    _id: 'field-id',
    question: 'Question',
    fieldType: BasicField.ShortText,
    ...partial,
  }) as FormField

describe('formatResponseForCell', () => {
  it('returns an empty string when the field was not answered', () => {
    expect(formatResponseForCell(undefined)).toBe('')
  })

  it('returns a single answer as-is', () => {
    expect(formatResponseForCell(field({ answer: 'Tan Wei Ming' }))).toBe(
      'Tan Wei Ming',
    )
  })

  it('joins a checkbox answerArray with semicolons', () => {
    expect(
      formatResponseForCell(
        field({
          fieldType: BasicField.Checkbox,
          answerArray: ['Option 1', 'Option 2'],
        }),
      ),
    ).toBe('Option 1; Option 2')
  })

  it('joins table rows with commas and separates rows with semicolons', () => {
    expect(
      formatResponseForCell(
        field({
          fieldType: BasicField.Table,
          answerArray: [
            ['a1', 'a2'],
            ['b1', 'b2'],
          ],
        }),
      ),
    ).toBe('a1, a2; b1, b2')
  })

  it('describes a captured signature rather than printing its payload', () => {
    expect(
      formatResponseForCell(
        field({
          fieldType: BasicField.Signature,
          answerArray: ['draw;data:image/png;base64,iVBOR'],
        }),
      ),
    ).toBe('Signature captured.')
  })

  it('leaves an unsigned signature blank, whatever shape the empty answer takes', () => {
    const empty = (partial: Partial<FormField>) =>
      formatResponseForCell(
        field({ fieldType: BasicField.Signature, ...partial }),
      )

    expect(empty({ answerArray: [] })).toBe('')
    // An unanswered field arrives carrying an empty string, not nothing.
    expect(empty({ answerArray: [''] })).toBe('')
    expect(empty({ answerArray: ['   '] })).toBe('')
    expect(empty({ answer: '' })).toBe('')
  })

  it('names the file on an attachment, and stays blank without one', () => {
    expect(
      formatResponseForCell(
        field({ fieldType: BasicField.Attachment, answer: 'budget-2026.pdf' }),
      ),
    ).toBe('budget-2026.pdf')
    expect(
      formatResponseForCell(
        field({ fieldType: BasicField.Attachment, answer: '' }),
      ),
    ).toBe('')
  })

  it('marks only a signature as described', () => {
    expect(isDescribedFieldType(BasicField.Signature)).toBe(true)
    expect(isDescribedFieldType(BasicField.Attachment)).toBe(false)
  })

  it('renders an address as one readable line', () => {
    expect(
      formatResponseForCell(
        field({
          fieldType: BasicField.Address,
          answerArray: [
            '161',
            'BUKIT BATOK STREET 11',
            '',
            '01',
            '02',
            '650161',
          ],
        }),
      ),
    ).toBe('161, BUKIT BATOK STREET 11, #01-02, SINGAPORE 650161')
  })
})
