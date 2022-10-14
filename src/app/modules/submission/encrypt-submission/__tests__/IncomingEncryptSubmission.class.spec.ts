import { ok } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import formsgSdk from 'src/app/config/formsg-sdk'

import {
  BasicField,
  FormResponseMode,
  LogicType,
} from '../../../../../../shared/types'
import {
  generateDefaultField,
  generateProcessedSingleAnswerResponse,
  generateSingleAnswerResponse,
} from '../../../../../../tests/unit/backend/helpers/generate-form-data'
import * as LogicUtil from '../../../../../shared/util/logic'
import {
  IPopulatedEncryptedForm,
  IPreventSubmitLogicSchema,
} from '../../../../../types'
import { checkIsEncryptedEncoding } from '../../../../utils/encryption'
import {
  ConflictError,
  ProcessingError,
  ValidateFieldError,
} from '../../submission.errors'
import IncomingEncryptSubmission from '../IncomingEncryptSubmission.class'

jest.mock('../../../../utils/encryption')
const mockCheckIsEncryptedEncoding = mocked(checkIsEncryptedEncoding)

type VerificationMock = {
  authenticate: () => boolean
}

describe('IncomingEncryptSubmission', () => {
  beforeEach(() => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => true)
  })
  it('should create an incoming encrypt submission with valid form and responses', () => {
    mockCheckIsEncryptedEncoding.mockReturnValueOnce(ok(true))
    const mobileField = generateDefaultField(BasicField.Mobile, {
      isVerifiable: true,
    })
    const emailField = generateDefaultField(BasicField.Email, {
      isVerifiable: true,
      autoReplyOptions: {
        hasAutoReply: true,
        autoReplySubject: 'subject',
        autoReplySender: 'sender@test.gov.sg',
        autoReplyMessage: 'message',
        includeFormSummary: false,
      },
    })
    const mobileResponse = generateSingleAnswerResponse(
      mobileField,
      '+6587654321',
      'signature',
    )
    const emailResponse = generateSingleAnswerResponse(
      emailField,
      'test@example.com',
      'signature',
    )
    const responses = [mobileResponse, emailResponse]
    const initResult = IncomingEncryptSubmission.init(
      {
        responseMode: FormResponseMode.Encrypt,
        form_fields: [mobileField, emailField],
      } as unknown as IPopulatedEncryptedForm,
      responses,
      '',
    )
    expect(initResult._unsafeUnwrap().responses).toEqual(responses)
  })

  it('should fail when responses are missing', () => {
    mockCheckIsEncryptedEncoding.mockReturnValueOnce(ok(true))
    const mobileField = generateDefaultField(BasicField.Mobile, {
      isVerifiable: true,
    })
    const emailField = generateDefaultField(BasicField.Email, {
      isVerifiable: true,
      autoReplyOptions: {
        hasAutoReply: true,
        autoReplySubject: 'subject',
        autoReplySender: 'sender@test.gov.sg',
        autoReplyMessage: 'message',
        includeFormSummary: false,
      },
    })
    const mobileResponse = generateSingleAnswerResponse(
      mobileField,
      '+6587654321',
      'signature',
    )
    const responses = [mobileResponse]
    const initResult = IncomingEncryptSubmission.init(
      {
        responseMode: FormResponseMode.Encrypt,
        form_fields: [mobileField, emailField],
      } as unknown as IPopulatedEncryptedForm,
      responses,
      '',
    )
    expect(initResult._unsafeUnwrapErr()).toEqual(
      new ConflictError('Some form fields are missing'),
    )
  })

  it('should allow responses for encrypt mode hidden fields', async () => {
    mockCheckIsEncryptedEncoding.mockReturnValueOnce(ok(true))
    // Only check for mobile and email fields, since the other fields are
    // e2e encrypted from the browser.
    const mobileField = generateDefaultField(BasicField.Mobile, {
      isVerifiable: true,
    })
    const emailField = generateDefaultField(BasicField.Email, {
      isVerifiable: true,
      autoReplyOptions: {
        hasAutoReply: true,
        autoReplySubject: 'subject',
        autoReplySender: 'sender@test.gov.sg',
        autoReplyMessage: 'message',
        includeFormSummary: false,
      },
    })
    // Add answers to both mobile and email fields
    const mobileProcessedResponse = generateProcessedSingleAnswerResponse({
      field: mobileField,
      answer: '+6587654321',
      signature: 'signature',
    })
    mobileProcessedResponse.isVisible = false

    const emailProcessedResponse = generateProcessedSingleAnswerResponse({
      field: emailField,
      answer: 'test@example.com',
      signature: 'signature',
    })
    emailProcessedResponse.isVisible = false

    const responses = [mobileProcessedResponse, emailProcessedResponse]

    const result = IncomingEncryptSubmission.init(
      {
        responseMode: FormResponseMode.Encrypt,
        form_fields: [mobileField, emailField],
      } as unknown as IPopulatedEncryptedForm,
      responses,
      '',
    )

    expect(result.isOk()).toEqual(true)
    expect(result._unsafeUnwrap().responses).toEqual(responses)
  })

  it('should return error when any responses are not valid for encrypted form submission', async () => {
    mockCheckIsEncryptedEncoding.mockReturnValueOnce(ok(true))
    // Only mobile and email fields are parsed, since the other fields are
    // e2e encrypted from the browser.
    const mobileField = generateDefaultField(BasicField.Mobile, {
      isVerifiable: true,
    })
    const mobileResponse = generateSingleAnswerResponse(mobileField, 'invalid')

    const result = IncomingEncryptSubmission.init(
      {
        responseMode: FormResponseMode.Encrypt,
        form_fields: [mobileField],
      } as unknown as IPopulatedEncryptedForm,
      [mobileResponse],
      '',
    )

    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toEqual([
      new ValidateFieldError('Invalid answer submitted'),
    ])
  })

  it('should return error when encrypted form submission is prevented by logic', async () => {
    mockCheckIsEncryptedEncoding.mockReturnValueOnce(ok(true))
    // Mock logic util to return non-empty to check if error is thrown
    jest.spyOn(LogicUtil, 'getLogicUnitPreventingSubmit').mockReturnValueOnce({
      preventSubmitMessage: 'mock prevent submit',
      conditions: [],
      logicType: LogicType.PreventSubmit,
      _id: 'some id',
    } as unknown as IPreventSubmitLogicSchema)

    const result = IncomingEncryptSubmission.init(
      {
        responseMode: FormResponseMode.Encrypt,
        form_fields: [],
      } as unknown as IPopulatedEncryptedForm,
      [],
      '',
    )

    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toEqual(
      new ProcessingError('Submission prevented by form logic'),
    )
  })
})
