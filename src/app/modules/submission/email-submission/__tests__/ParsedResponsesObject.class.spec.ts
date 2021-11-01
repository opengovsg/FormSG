import { ObjectId } from 'bson-ext'

import {
  BasicField,
  FormResponseMode,
  LogicType,
} from '../../../../../../shared/types'
import * as LogicUtil from '../../../../../../shared/utils/logic'
import {
  generateDefaultField,
  generateProcessedSingleAnswerResponse,
  generateSingleAnswerResponse,
} from '../../../../../../tests/unit/backend/helpers/generate-form-data'
import {
  FormFieldSchema,
  IFormDocument,
  IPreventSubmitLogicSchema,
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

    const mockForm = {
      _id: new ObjectId(),
      responseMode: FormResponseMode.Email,
      form_fields: [shortTextField, decimalField],
      form_logics: [],
      toJSON: () => mockForm,
    } as unknown as IFormDocument
    const result = ParsedResponsesObject.parseResponses(mockForm, [
      shortTextResponse,
      decimalResponse,
    ])

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
        toJSON: () => this,
      } as IFormDocument,
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

    const mockForm = {
      _id: new ObjectId(),
      responseMode: FormResponseMode.Email,
      form_fields: [nricField],
      form_logics: [],
      toJSON: () => mockForm,
    } as unknown as IFormDocument

    const result = ParsedResponsesObject.parseResponses(mockForm, [
      nricResponse,
    ])

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

    const spy = jest
      .spyOn(LogicUtil, 'getLogicUnitPreventingSubmit')
      .mockReturnValueOnce(mockReturnLogicUnit)

    const mockForm = {
      _id: new ObjectId(),
      responseMode: FormResponseMode.Email,
      form_fields: [] as FormFieldSchema[],
      form_logics: [],
      toJSON: () => mockForm,
    } as unknown as IFormDocument

    const result = ParsedResponsesObject.parseResponses(mockForm, [])

    expect(spy).toHaveBeenCalledTimes(1)
    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toEqual(
      new ProcessingError('Submission prevented by form logic'),
    )
  })
})
