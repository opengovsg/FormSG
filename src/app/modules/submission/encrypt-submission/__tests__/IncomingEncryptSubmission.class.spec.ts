import { ok } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import {
  generateDefaultField,
  generateSingleAnswerResponse,
} from '../../../../../../tests/unit/backend/helpers/generate-form-data'
import {
  BasicField,
  IPopulatedEncryptedForm,
  ResponseMode,
} from '../../../../../types'
import { checkIsEncryptedEncoding } from '../../../../utils/encryption'
import { ConflictError } from '../../submission.errors'
import IncomingEncryptSubmission from '../IncomingEncryptSubmission.class'

jest.mock('../../../../utils/encryption')
const mockCheckIsEncryptedEncoding = mocked(checkIsEncryptedEncoding)

describe('IncomingEncryptSubmission', () => {
  it('should create an incoming encrypt submission with valid form and responses', () => {
    mockCheckIsEncryptedEncoding.mockReturnValueOnce(ok(true))
    const mobileField = generateDefaultField(BasicField.Mobile)
    const emailField = generateDefaultField(BasicField.Email)
    const mobileResponse = generateSingleAnswerResponse(
      mobileField,
      '+6587654321',
    )
    const emailResponse = generateSingleAnswerResponse(
      emailField,
      'test@example.com',
    )
    const responses = [mobileResponse, emailResponse]
    const initResult = IncomingEncryptSubmission.init(
      {
        responseMode: ResponseMode.Encrypt,
        form_fields: [mobileField, emailField],
      } as unknown as IPopulatedEncryptedForm,
      responses,
      '',
    )
    expect(initResult._unsafeUnwrap().responses).toEqual(responses)
  })

  it('should fail when responses are missing', () => {
    mockCheckIsEncryptedEncoding.mockReturnValueOnce(ok(true))
    const mobileField = generateDefaultField(BasicField.Mobile)
    const emailField = generateDefaultField(BasicField.Email)
    const mobileResponse = generateSingleAnswerResponse(
      mobileField,
      '+6587654321',
    )
    const responses = [mobileResponse]
    const initResult = IncomingEncryptSubmission.init(
      {
        responseMode: ResponseMode.Encrypt,
        form_fields: [mobileField, emailField],
      } as unknown as IPopulatedEncryptedForm,
      responses,
      '',
    )
    expect(initResult._unsafeUnwrapErr()).toEqual(
      new ConflictError('Some form fields are missing'),
    )
  })
})
