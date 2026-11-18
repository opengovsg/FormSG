import {
  BasicField,
  CorppassAttribute,
  FormResponseMode,
  LogicType,
  MyInfoAttribute,
} from 'formsg-shared/types'
import * as LogicUtil from 'formsg-shared/utils/logic'

import {
  generateDefaultField,
  generateProcessedSingleAnswerResponse,
  generateSingleAnswerResponse,
} from '../../../../../__tests__/unit/backend/helpers/generate-form-data'
import {
  FormFieldSchema,
  IFormDocument,
  IPreventSubmitLogicSchema,
} from '../../../../types'
import ParsedResponsesObject from '../ParsedResponsesObject.class'
import {
  ConflictError,
  ProcessingError,
  ValidateFieldError,
} from '../submission.errors'
import { ProcessedFieldResponse } from '../submission.types'

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

    const shortTextProcessedResponse = generateProcessedSingleAnswerResponse({
      field: shortTextField,
      answer: 'the quick brown fox jumps over the lazy dog',
    })
    const decimalProcessedResponse = generateProcessedSingleAnswerResponse({
      field: decimalField,
      answer: '3.142',
    })

    const result = ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Email,
        form_fields: [shortTextField, decimalField],
      } as IFormDocument,
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

    const result = ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Email,
        form_fields: [nricField],
      } as IFormDocument,
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
        form_fields: [] as FormFieldSchema[],
      } as IFormDocument,
      [],
    )

    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toEqual(
      new ProcessingError('Submission prevented by form logic'),
    )
  })

  test('should inject MyInfo attribute if field is a MyInfo field', async () => {
    // Single MyInfo field
    const shortTextMyInfoAttr = { attr: MyInfoAttribute.Name }
    const shortTextField = generateDefaultField(BasicField.ShortText, {
      myInfo: shortTextMyInfoAttr,
    })
    const decimalField = generateDefaultField(BasicField.Decimal)

    // Add answers to both mobile and email fields
    const shortTextResponse = generateSingleAnswerResponse(
      shortTextField,
      'the quick brown fox jumps over the lazy dog',
      // Note no MyInfo attribute in response, should be injected.
    )
    const decimalResponse = generateSingleAnswerResponse(decimalField, '3.142')

    const shortTextProcessedResponse = generateProcessedSingleAnswerResponse({
      answer: 'the quick brown fox jumps over the lazy dog',
      field: shortTextField,
      myInfo: shortTextMyInfoAttr,
    })
    const decimalProcessedResponse = generateProcessedSingleAnswerResponse({
      field: decimalField,
      answer: '3.142',
    })

    const result = ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Email,
        form_fields: [shortTextField, decimalField],
      } as IFormDocument,
      [shortTextResponse, decimalResponse],
    )

    const expectedParsed: ProcessedFieldResponse[] = [
      { ...shortTextProcessedResponse, isVisible: true },
      { ...decimalProcessedResponse, isVisible: true },
    ]

    expect(result.isOk()).toEqual(true)
    expect(result._unsafeUnwrap().getAllResponses()).toEqual(expectedParsed)
  })
})

describe('login identity answers', () => {
  const parseIdentityAnswer = (
    identity: Record<string, unknown>,
    answer: string,
    fieldType: BasicField.Nric | BasicField.Uen = BasicField.Nric,
  ) => {
    const field = {
      ...generateDefaultField(fieldType),
      ...identity,
    } as FormFieldSchema
    return ParsedResponsesObject.parseResponses(
      {
        responseMode: FormResponseMode.Encrypt,
        form_fields: [field],
      } as IFormDocument,
      [generateSingleAnswerResponse(field, answer)],
    )
  }

  it('accepts a foreign Corppass UID, which is not a valid NRIC', () => {
    expect(
      parseIdentityAnswer(
        { corppass: { attr: CorppassAttribute.Uid } },
        'FOREIGN12345',
      ).isOk(),
    ).toBe(true)
  })

  it('accepts a non-UEN Corppass entity ID, which is not a valid UEN', () => {
    expect(
      parseIdentityAnswer(
        { corppass: { attr: CorppassAttribute.Uen } },
        'C123456789',
        BasicField.Uen,
      ).isOk(),
    ).toBe(true)
  })

  it('still validates the MyInfo NRIC/FIN as an NRIC', () => {
    expect(
      parseIdentityAnswer(
        { myInfo: { attr: MyInfoAttribute.UinFin } },
        'FOREIGN12345',
      )._unsafeUnwrapErr(),
    ).toBeInstanceOf(ValidateFieldError)
  })
})
