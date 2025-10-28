import { CLIENT_RADIO_OTHERS_INPUT_VALUE } from '~shared/constants'
import { CountryRegion } from '~shared/constants/countryRegion'
import {
  AttachmentFieldResponseV3,
  BasicField,
  FieldResponseV3,
  FormFieldDto,
} from '~shared/types'

import bufferToFile from '~utils/bufferToFile'
import { RadioFieldValues } from '~templates/Field'

import { extractMrfPreviousStepResponseValue } from '../extractMrfPreviousStepResponseValue'

vi.mock('~utils/bufferToFile')

describe('extractMrfPreviousStepResponseValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the correct CountryRegion enum value if matches', () => {
    const field: FormFieldDto = { fieldType: BasicField.CountryRegion } as any
    const previousResponse: FieldResponseV3 = { answer: 'SINGAPORE' } as any

    const result = extractMrfPreviousStepResponseValue(field, previousResponse)

    expect(result).toBe(CountryRegion.Singapore)
  })

  it('should return undefined if CountryRegion does not match', () => {
    const field: FormFieldDto = { fieldType: BasicField.CountryRegion } as any
    const previousResponse: FieldResponseV3 = { answer: 'Bad Country' } as any

    const result = extractMrfPreviousStepResponseValue(field, previousResponse)

    expect(result).toBeUndefined()
  })

  it('should return a file object for Attachment if buffer is provided', () => {
    const mockFile = new File([''], 'file.txt')
    vi.mocked(bufferToFile).mockReturnValue(mockFile)

    const field: FormFieldDto = { fieldType: BasicField.Attachment } as any
    const previousResponse: FieldResponseV3 = {
      answer: { answer: 'file.txt' } as AttachmentFieldResponseV3,
    } as any
    const buffer = new ArrayBuffer(8)

    const result = extractMrfPreviousStepResponseValue(
      field,
      previousResponse,
      buffer,
    )

    expect(result).toEqual(mockFile)
  })

  it('should return undefined for Attachment if buffer is not provided', () => {
    const field: FormFieldDto = { fieldType: BasicField.Attachment } as any
    const previousResponse: FieldResponseV3 = {
      answer: { answer: 'file.txt' } as AttachmentFieldResponseV3,
    } as any

    const result = extractMrfPreviousStepResponseValue(field, previousResponse)

    expect(result).toBeUndefined()
  })

  it('should set value to CLIENT_RADIO_OTHERS_INPUT_VALUE if othersInput exists but value is empty', () => {
    const field: FormFieldDto = { fieldType: BasicField.Radio } as any
    const previousResponse: FieldResponseV3 = {
      answer: { othersInput: 'some input', value: '' } as RadioFieldValues,
    } as any

    const result = extractMrfPreviousStepResponseValue(
      field,
      previousResponse,
    ) as RadioFieldValues

    expect(result.value).toBe(CLIENT_RADIO_OTHERS_INPUT_VALUE)
    expect(result.othersInput).toBe('some input')
  })

  it('should return undefined if previousFieldResponse is undefined', () => {
    const field: FormFieldDto = { fieldType: BasicField.Radio } as any

    const result = extractMrfPreviousStepResponseValue(field)

    expect(result).toBeUndefined()
  })

  it('should return the answer as-is for other field types', () => {
    const field: FormFieldDto = { fieldType: 'Text' } as any
    const previousResponse: FieldResponseV3 = { answer: 'Hello' } as any

    const result = extractMrfPreviousStepResponseValue(field, previousResponse)

    expect(result).toBe('Hello')
  })
})
