import {
  generateDefaultField,
  generateProcessedSingleAnswerResponse,
  generateSingleAnswerResponse,
} from '../../../../../../tests/unit/backend/helpers/generate-form-data'
import * as LogicUtil from '../../../../../shared/util/logic'
import {
  BasicField,
  FormResponseMode,
  IEmailFormSchema,
  IFormSchema,
  IPreventSubmitLogicSchema,
  LogicType,
} from '../../../../../types'
import {
  ConflictError,
  ProcessingError,
  ValidateFieldError,
} from '../../submission.errors'
import { ProcessedFieldResponse } from '../../submission.types'
import ParsedResponsesObject from '../ParsedResponsesObject.class'

describe('ParsedResponsesObject', () => {
  it('should return list of parsed responses for email form submission successfully', async () => {
    // Add answer to subset of field types
    const shortTextField = generateDefaultField(BasicField.ShortText)
    const decimalField = generateDefaultField(BasicField.Decimal)

    // Add answers to both mobile and email fields
    const shortTextResponse = generateSingleAnswerResponse(
      shortTextField,
      'the quick brown fox jumps over the lazy dog',
    )
    const decimalResponse = generateSingleAnswerResponse(decimalField, '3.142')

    const shortTextProcessedResponse = generateProcessedSingleAnswerResponse(
      shortTextField,
      'the quick brown fox jumps over the lazy dog',
    )
    const decimalProcessedResponse = generateProcessedSingleAnswerResponse(
      decimalField,
      '3.142',
    )

    const result = ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Email,
        form_fields: [shortTextField, decimalField],
      } as unknown as IFormSchema,
      [shortTextResponse, decimalResponse],
    )

    const expectedParsed: ProcessedFieldResponse[] = [
      { ...shortTextProcessedResponse, isVisible: true },
      { ...decimalProcessedResponse, isVisible: true },
    ]

    expect(result.isOk()).toEqual(true)
    expect(result._unsafeUnwrap().getAllResponses()).toEqual(expectedParsed)
  })

  it('should return error when email form has more fields than responses', async () => {
    const extraField = generateDefaultField(BasicField.Mobile)

    const result = ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Email,
        form_fields: [extraField],
      } as unknown as IEmailFormSchema,
      [],
    )

    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toEqual(
      new ConflictError('Some form fields are missing'),
    )
  })

  it('should return error when any responses are not valid for email form submission', async () => {
    // Set NRIC field in form as required.
    const nricField = generateDefaultField(BasicField.Nric)
    const nricResponse = generateSingleAnswerResponse(nricField, 'invalid')

    const result = ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Email,
        form_fields: [nricField],
      } as unknown as IEmailFormSchema,
      [nricResponse],
    )

    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should return error when email form submission is prevented by logic', async () => {
    // Mock logic util to return non-empty to check if error is thrown.
    const mockReturnLogicUnit = {
      preventSubmitMessage: 'mock prevent submit',
      conditions: [],
      logicType: LogicType.PreventSubmit,
      _id: 'some id',
    } as unknown as IPreventSubmitLogicSchema

    jest
      .spyOn(LogicUtil, 'getLogicUnitPreventingSubmit')
      .mockReturnValueOnce(mockReturnLogicUnit)

    const result = ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Email,
        form_fields: [],
      } as unknown as IEmailFormSchema,
      [],
    )

    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toEqual(
      new ProcessingError('Submission prevented by form logic'),
    )
  })
})
