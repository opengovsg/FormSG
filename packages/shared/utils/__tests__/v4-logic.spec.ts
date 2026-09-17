import { BasicField, FormFieldDto } from '../../types'
import { FieldResponsesV4Input } from '../v4-answer'
import { fieldResponsesV4ToLogicFieldResponseTransformer } from '../v4-logic'

const field = (_id: string, fieldType: BasicField): FormFieldDto =>
  ({ _id, fieldType, title: _id, required: false }) as unknown as FormFieldDto

describe('fieldResponsesV4ToLogicFieldResponseTransformer', () => {
  it('carries a logicable non-radio answer as a bare string input', () => {
    const formFields = [field('1', BasicField.YesNo)]
    const v4Responses = {
      '1': { fieldType: BasicField.YesNo, answer: { value: 'Yes' } },
    } as unknown as FieldResponsesV4Input

    expect(
      fieldResponsesV4ToLogicFieldResponseTransformer(v4Responses, formFields),
    ).toEqual([{ _id: '1', fieldType: BasicField.YesNo, input: 'Yes' }])
  })

  it('moves a Radio Others free text into `othersInput`', () => {
    // NOTE: The evaluator matches an `Others` condition on a non-empty
    // `othersInput` with no `value`. V4 puts the free text in `value` instead.
    const formFields = [field('1', BasicField.Radio)]
    const v4Responses = {
      '1': {
        fieldType: BasicField.Radio,
        answer: { value: 'my own reason', isOthersInput: true },
      },
    } as unknown as FieldResponsesV4Input

    expect(
      fieldResponsesV4ToLogicFieldResponseTransformer(v4Responses, formFields),
    ).toEqual([
      {
        _id: '1',
        fieldType: BasicField.Radio,
        input: { othersInput: 'my own reason' },
      },
    ])
  })

  it('keeps a listed Radio option in `value`', () => {
    const formFields = [field('1', BasicField.Radio)]
    const v4Responses = {
      '1': { fieldType: BasicField.Radio, answer: { value: 'an option' } },
    } as unknown as FieldResponsesV4Input

    expect(
      fieldResponsesV4ToLogicFieldResponseTransformer(v4Responses, formFields),
    ).toEqual([
      { _id: '1', fieldType: BasicField.Radio, input: { value: 'an option' } },
    ])
  })

  it('emits a non-logicable field with no value at all', () => {
    // RATIONALE: The evaluator needs every answered field in the list, even
    // with no value — a hidden condition field must still fail its condition.
    const formFields = [field('1', BasicField.Address)]
    const v4Responses = {
      '1': {
        fieldType: BasicField.Address,
        answer: {
          postalCode: { value: '123456' },
          blockNumber: { value: '1' },
          streetName: { value: 'a street' },
          buildingName: { value: '' },
          levelNumber: { value: '' },
          unitNumber: { value: '' },
        },
      },
    } as unknown as FieldResponsesV4Input

    expect(
      fieldResponsesV4ToLogicFieldResponseTransformer(v4Responses, formFields),
    ).toEqual([{ _id: '1', fieldType: BasicField.Address }])
  })

  it('omits a field with no answer, and a response with no form field', () => {
    const formFields = [
      field('1', BasicField.YesNo),
      field('2', BasicField.Radio),
    ]
    const v4Responses = {
      '2': { fieldType: BasicField.Radio, answer: { value: 'an option' } },
      '9': { fieldType: BasicField.YesNo, answer: { value: 'Yes' } },
    } as unknown as FieldResponsesV4Input

    expect(
      fieldResponsesV4ToLogicFieldResponseTransformer(v4Responses, formFields),
    ).toEqual([
      { _id: '2', fieldType: BasicField.Radio, input: { value: 'an option' } },
    ])
  })

  it('reads `fieldType` from the form field, never from the response', () => {
    // NOTE: The MRF response schema also accepts a client-supplied `fieldType`;
    // it must not be trusted.
    const formFields = [field('1', BasicField.YesNo)]
    const v4Responses = {
      '1': { fieldType: BasicField.Radio, answer: { value: 'Yes' } },
    } as unknown as FieldResponsesV4Input

    expect(
      fieldResponsesV4ToLogicFieldResponseTransformer(v4Responses, formFields),
    ).toEqual([{ _id: '1', fieldType: BasicField.YesNo, input: 'Yes' }])
  })
})
