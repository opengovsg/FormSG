import type { FieldResponseV4 } from '@opengovsg/formsg-sdk'

import { CLIENT_RADIO_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { CountryRegion } from 'formsg-shared/constants/countryRegion'
import { BasicField, FormFieldDto } from 'formsg-shared/types'

import bufferToFile from '~utils/bufferToFile'
import { FormFieldValues } from '~templates/Field'

import { createResponsesV4 } from '~features/public-form/utils/createSubmission'

import { extractMrfPreviousStepResponseValue } from '../extractMrfPreviousStepResponseValue'

vi.mock('~utils/bufferToFile')

const mockField = (fieldType: BasicField, id = 'a'.repeat(24)): FormFieldDto =>
  ({ _id: id, fieldType }) as FormFieldDto

const v4Response = (
  fieldType: BasicField,
  answer: unknown,
): Pick<FieldResponseV4, 'fieldType' | 'answer'> =>
  ({ fieldType, answer }) as Pick<FieldResponseV4, 'fieldType' | 'answer'>

describe('extractMrfPreviousStepResponseValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should unwrap string-like answers to their raw value', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.ShortText),
      v4Response(BasicField.ShortText, { value: 'Hello' }),
    )

    expect(result).toBe('Hello')
  })

  it('should unwrap yes/no answers to their raw value', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.YesNo),
      v4Response(BasicField.YesNo, { value: 'Yes' }),
    )

    expect(result).toBe('Yes')
  })

  it('should return the correct CountryRegion enum value if matches', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.CountryRegion),
      v4Response(BasicField.CountryRegion, { value: 'SINGAPORE' }),
    )

    expect(result).toBe(CountryRegion.Singapore)
  })

  it('should return undefined if CountryRegion does not match', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.CountryRegion),
      v4Response(BasicField.CountryRegion, { value: 'Bad Country' }),
    )

    expect(result).toBeUndefined()
  })

  it('should pass through verifiable answers with signature', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Email),
      v4Response(BasicField.Email, { value: 'a@example.com', signature: 's' }),
    )

    expect(result).toEqual({ value: 'a@example.com', signature: 's' })
  })

  it('should return a file object for Attachment if buffer is provided', () => {
    const mockFile = new File([''], 'file.txt')
    vi.mocked(bufferToFile).mockReturnValue(mockFile)
    const buffer = new Uint8Array(8)

    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Attachment),
      v4Response(BasicField.Attachment, {
        value: 'file.txt',
        hasBeenScanned: true,
      }),
      buffer,
    )

    expect(bufferToFile).toHaveBeenCalledWith(buffer, 'file.txt')
    expect(result).toEqual(mockFile)
  })

  it('should return undefined for Attachment if buffer is not provided', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Attachment),
      v4Response(BasicField.Attachment, {
        value: 'file.txt',
        hasBeenScanned: true,
      }),
    )

    expect(result).toBeUndefined()
  })

  it('should map others radio answers to the client sentinel + othersInput', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Radio),
      v4Response(BasicField.Radio, {
        value: 'some input',
        isOthersInput: true,
      }),
    )

    expect(result).toEqual({
      value: CLIENT_RADIO_OTHERS_INPUT_VALUE,
      othersInput: 'some input',
    })
  })

  it('should map regular radio answers to { value }', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Radio),
      v4Response(BasicField.Radio, { value: 'Option 1', isOthersInput: false }),
    )

    expect(result).toEqual({ value: 'Option 1' })
  })

  it('should pass through checkbox answers', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Checkbox),
      v4Response(BasicField.Checkbox, {
        value: ['A', 'B'],
        othersInput: 'other',
      }),
    )

    expect(result).toEqual({ value: ['A', 'B'], othersInput: 'other' })
  })

  it('should flatten table answers into rowNum-ordered row arrays', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Table),
      v4Response(BasicField.Table, {
        'row-id-2': { rowNum: 1, value: { col1: 'r2c1', col2: 'r2c2' } },
        'row-id-1': { rowNum: 0, value: { col1: 'r1c1', col2: 'r1c2' } },
      }),
    )

    expect(result).toEqual([
      { col1: 'r1c1', col2: 'r1c2' },
      { col1: 'r2c1', col2: 'r2c2' },
    ])
  })

  it('should unwrap address sub-fields into addressSubFields', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Address),
      v4Response(BasicField.Address, {
        postalCode: { value: '123456' },
        blockNumber: { value: '12A' },
        streetName: { value: 'Main Street' },
        buildingName: { value: '' },
        levelNumber: { value: '05' },
        unitNumber: { value: '01' },
      }),
    )

    expect(result).toEqual({
      addressSubFields: {
        postalCode: '123456',
        blockNumber: '12A',
        streetName: 'Main Street',
        buildingName: '',
        levelNumber: '05',
        unitNumber: '01',
      },
    })
  })

  it('should map signature answers to signature field values', () => {
    const strokes = [
      [
        [1, 2, 0.5],
        [3, 4, 0.6],
      ],
    ]
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Signature),
      v4Response(BasicField.Signature, { value: strokes, type: 'draw' }),
    )

    expect(result).toEqual({ type: 'draw', value: strokes })
  })

  it('should return undefined if previousFieldResponse is undefined', () => {
    const result = extractMrfPreviousStepResponseValue(
      mockField(BasicField.Radio),
    )

    expect(result).toBeUndefined()
  })

  it('should return undefined for non-input field types', () => {
    for (const fieldType of [
      BasicField.Section,
      BasicField.Statement,
      BasicField.Image,
    ]) {
      const result = extractMrfPreviousStepResponseValue(
        mockField(fieldType),
        v4Response(fieldType, { value: '' }),
      )
      expect(result).toBeUndefined()
    }
  })

  describe('round-trip with createResponsesV4', () => {
    it('should recover the original form input values from built V4 responses', () => {
      // Inputs → createResponsesV4 (wire V4) → extract (prefill) must be the
      // identity for every prefillable field type, since step N+1 re-submits
      // non-editable values through this exact loop.
      const fieldIds = {
        text: '0'.repeat(24),
        yesNo: '1'.repeat(24),
        email: '2'.repeat(24),
        radioOthers: '3'.repeat(24),
        checkbox: '4'.repeat(24),
        table: '5'.repeat(24),
        address: '6'.repeat(24),
        signature: '7'.repeat(24),
        countryRegion: '8'.repeat(24),
      }
      const formFields = [
        mockField(BasicField.ShortText, fieldIds.text),
        mockField(BasicField.YesNo, fieldIds.yesNo),
        mockField(BasicField.Email, fieldIds.email),
        mockField(BasicField.Radio, fieldIds.radioOthers),
        mockField(BasicField.Checkbox, fieldIds.checkbox),
        mockField(BasicField.Table, fieldIds.table),
        mockField(BasicField.Address, fieldIds.address),
        mockField(BasicField.Signature, fieldIds.signature),
        mockField(BasicField.CountryRegion, fieldIds.countryRegion),
      ]
      const formInputs = {
        [fieldIds.text]: 'hello',
        [fieldIds.yesNo]: 'No',
        [fieldIds.email]: { value: 'a@example.com', signature: 'sig' },
        [fieldIds.radioOthers]: {
          value: CLIENT_RADIO_OTHERS_INPUT_VALUE,
          othersInput: 'custom',
        },
        [fieldIds.checkbox]: { value: ['A'], othersInput: 'other' },
        [fieldIds.table]: [{ col1: 'a', col2: 'b' }],
        [fieldIds.address]: {
          addressSubFields: {
            postalCode: '123456',
            blockNumber: '12A',
            streetName: 'Main Street',
            buildingName: '',
            levelNumber: '05',
            unitNumber: '01',
          },
        },
        [fieldIds.signature]: { type: 'draw', value: [[[1, 2, 0.5]]] },
        [fieldIds.countryRegion]: CountryRegion.Singapore,
      } as unknown as FormFieldValues

      const wireResponses = createResponsesV4(formFields, formInputs, [])

      for (const field of formFields) {
        const extracted = extractMrfPreviousStepResponseValue(
          field,
          wireResponses[field._id],
        )
        expect(extracted).toEqual(formInputs[field._id])
      }
    })
  })
})
