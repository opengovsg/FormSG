import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import { ObjectId } from 'bson'
import moment from 'moment-timezone'
import { ok } from 'neverthrow'
import {
  BasicField,
  ChildBirthRecordsResponseV3,
  LongTextResponseV3,
  ShortTextResponseV3,
  SubmissionType,
} from 'shared/types'

import { MultirespondentSubmissionData } from 'src/types'

import * as fieldValidation from '../../../../utils/field-validation'
import { ValidateFieldErrorV3 } from '../../submission.errors'
import {
  createMultirespondentSubmissionDto,
  validateMrfFieldResponses,
} from '../multirespondent-submission.utils'

describe('multirespondent-submission.utils', () => {
  describe('createMultirespondentSubmissionDto', () => {
    it('should create an encrypted submission DTO sucessfully', () => {
      // Arrange
      const createdDate = new Date()
      const submissionData = {
        _id: new ObjectId(),
        created: createdDate,
        submissionPublicKey: 'some public key',
        encryptedSubmissionSecretKey: 'some encrypted secret key',
        encryptedContent: 'some encrypted content',
        submissionType: SubmissionType.Multirespondent,
      } as MultirespondentSubmissionData
      const attachmentPresignedUrls = {
        someSubmissionId: 'some presigned url',
      }

      // Act
      const actual = createMultirespondentSubmissionDto(
        submissionData,
        attachmentPresignedUrls,
      )

      // Assert
      expect(actual).toEqual({
        refNo: submissionData._id,
        submissionTime: moment(submissionData.created)
          .tz('Asia/Singapore')
          .format('ddd, D MMM YYYY, hh:mm:ss A'),
        submissionPublicKey: submissionData.submissionPublicKey,
        encryptedContent: submissionData.encryptedContent,
        encryptedSubmissionSecretKey:
          submissionData.encryptedSubmissionSecretKey,
        attachmentMetadata: attachmentPresignedUrls,
        submissionType: SubmissionType.Multirespondent,
      })
    })
  })

  describe('validateMrfFieldResponses', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should return error when children field is submitted', () => {
      // Arrange
      const mockFormId = 'mockFormId'
      const field1Id = 'field1'
      const mockVisibleFieldIds = new Set([field1Id])
      const mockFormFields = [
        generateDefaultField(BasicField.ShortText, {
          _id: field1Id,
        }),
      ]
      const mockResponses = {
        [field1Id]: {
          fieldType: BasicField.Children,
          answer: {
            child: [],
            childFields: [],
          },
        } as ChildBirthRecordsResponseV3,
      }

      // Act
      const result = validateMrfFieldResponses({
        formId: mockFormId,
        visibleFieldIds: mockVisibleFieldIds,
        formFields: mockFormFields,
        responses: mockResponses,
      })

      // Assert
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidateFieldErrorV3)
      expect(result._unsafeUnwrapErr().message).toBe(
        'Children field type is not supported for MRF submisisons',
      )
    })

    it('should invoke validateFieldV3 with isVisible true when non-hidden and supported field type is submitted', () => {
      // Arrange
      const validateFieldV3Mock = jest
        .spyOn(fieldValidation, 'validateFieldV3')
        .mockReturnValue(ok(true))
      const mockFormId = 'mockFormId'
      const field1Id = 'field1'
      const mockVisibleFieldIds = new Set([field1Id])
      const mockFormFields = [
        generateDefaultField(BasicField.ShortText, { _id: field1Id }),
      ]
      const mockResponses = {
        [field1Id]: {
          fieldType: BasicField.ShortText,
          answer: 'Some text',
        } as ShortTextResponseV3,
      }

      // Act
      validateMrfFieldResponses({
        formId: mockFormId,
        visibleFieldIds: mockVisibleFieldIds,
        formFields: mockFormFields,
        responses: mockResponses,
      })

      // Assert
      expect(validateFieldV3Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[0],
        response: mockResponses.field1,
        isVisible: true,
      })

      expect(validateFieldV3Mock).toHaveBeenCalledOnce()
    })

    it('should invoke validateFieldV3 with isVisible false when hidden and supported field type is submitted', () => {
      // Arrange
      const validateFieldV3Mock = jest
        .spyOn(fieldValidation, 'validateFieldV3')
        .mockReturnValue(ok(true))
      const mockFormId = 'mockFormId'
      const field1Id = 'field1'
      const field2Id = 'field2'
      const mockVisibleFieldIds = new Set([field2Id])
      const mockFormFields = [
        generateDefaultField(BasicField.ShortText, { _id: field1Id }),
        generateDefaultField(BasicField.LongText, { _id: field2Id }),
      ]
      const mockResponses = {
        [field1Id]: {
          fieldType: BasicField.ShortText,
          answer: 'Some text',
        } as ShortTextResponseV3,
        [field2Id]: {
          fieldType: BasicField.LongText,
          answer: 'Some long text',
        } as LongTextResponseV3,
      }

      // Act
      validateMrfFieldResponses({
        formId: mockFormId,
        visibleFieldIds: mockVisibleFieldIds,
        formFields: mockFormFields,
        responses: mockResponses,
      })

      // Assert
      expect(validateFieldV3Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[0],
        response: mockResponses.field1,
        isVisible: false,
      })

      expect(validateFieldV3Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[1],
        response: mockResponses.field2,
        isVisible: true,
      })

      expect(validateFieldV3Mock).toHaveBeenCalledTimes(2)
    })
  })
})
