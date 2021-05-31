import { ObjectId } from 'bson-ext'
import moment from 'moment-timezone'
import { ok } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import {
  BasicField,
  IFormSchema,
  ResponseMode,
  SubmissionData,
} from 'src/types'

import {
  generateDefaultField,
  generateSingleAnswerResponse,
} from '../../../../../../tests/unit/backend/helpers/generate-form-data'
import { checkIsEncryptedEncoding } from '../../../../utils/encryption'
import {
  createEncryptedSubmissionDto,
  IncomingEncryptSubmission,
} from '../encrypt-submission.utils'

jest.mock('../../../../utils/encryption')
const mockCheckIsEncryptedEncoding = mocked(checkIsEncryptedEncoding)

describe('encrypt-submission.utils', () => {
  describe('createEncryptedSubmissionDto', () => {
    it('should create an encrypted submission DTO sucessfully', () => {
      // Arrange
      const createdDate = new Date()
      const submissionData = {
        _id: new ObjectId(),
        created: createdDate,
        encryptedContent: 'some encrypted content',
        verifiedContent: 'some verified content',
      } as SubmissionData
      const attachmentPresignedUrls = {
        someSubmissionId: 'some presigned url',
      }

      // Act
      const actual = createEncryptedSubmissionDto(
        submissionData,
        attachmentPresignedUrls,
      )

      // Assert
      expect(actual).toEqual({
        refNo: submissionData._id,
        submissionTime: moment(submissionData.created)
          .tz('Asia/Singapore')
          .format('ddd, D MMM YYYY, hh:mm:ss A'),
        content: submissionData.encryptedContent,
        verified: submissionData.verifiedContent,
        attachmentMetadata: attachmentPresignedUrls,
      })
    })
  })

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
        ({
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField, emailField],
        } as unknown) as IFormSchema,
        responses,
        '',
      )
      if (initResult.isErr()) {
        throw new Error('Init failed')
      }
      expect(initResult.value.responses).toEqual(responses)
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
        ({
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField, emailField],
        } as unknown) as IFormSchema,
        responses,
        '',
      )
      expect(initResult.isErr()).toEqual(true)
    })
  })
})
