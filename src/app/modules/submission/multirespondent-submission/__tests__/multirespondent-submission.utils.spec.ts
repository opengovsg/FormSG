import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import { ObjectId } from 'bson'
import moment from 'moment-timezone'
import { ok } from 'neverthrow'
import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'shared/constants/form'
import {
  AttachmentResponseV3,
  BasicField,
  CheckboxResponseV3,
  ChildBirthRecordsResponseV3,
  EmailResponseV3,
  FieldResponsesV3,
  LongTextResponseV3,
  NumberResponseV3,
  ShortTextResponseV3,
  SubmissionType,
  TableResponseV3,
} from 'shared/types'

import {
  FormFieldSchema,
  IAttachmentFieldSchema,
  ICheckboxFieldSchema,
  IEmailFieldSchema,
  INumberFieldSchema,
  IShortTextFieldSchema,
  ITableFieldSchema,
  MultirespondentSubmissionData,
} from 'src/types'

import * as fieldValidation from '../../../../utils/field-validation'
import { ValidateFieldErrorV3 } from '../../submission.errors'
import {
  createMultirespondentSubmissionDto,
  getQuestionTitleAnswerString,
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

  describe('getQuestionTitleAnswerString', () => {
    it('should extract question-answer pairs for basic field types', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Short Text',
          fieldType: BasicField.ShortText,
        } as IShortTextFieldSchema,
        {
          _id: '2',
          title: 'Number',
          fieldType: BasicField.Number,
        } as INumberFieldSchema,
        {
          _id: '3',
          title: 'Email',
          fieldType: BasicField.Email,
        } as IEmailFieldSchema,
      ]
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.ShortText,
          answer: 'Test answer',
        } as ShortTextResponseV3,
        '2': { fieldType: BasicField.Number, answer: '42' } as NumberResponseV3,
        '3': {
          fieldType: BasicField.Email,
          answer: { value: 'test@example.com' },
        } as EmailResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        { question: 'Short Text', answer: 'Test answer' },
        { question: 'Number', answer: '42' },
        { question: 'Email', answer: 'test@example.com' },
      ])
    })

    it('should handle attachment fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'File Upload',
          fieldType: BasicField.Attachment,
        } as IAttachmentFieldSchema,
      ]
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Attachment,
          answer: { answer: 'file.pdf' },
        } as AttachmentResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        { question: '[Attachment] File Upload', answer: 'file.pdf' },
      ])
    })

    it('should handle table fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Table of Name and Age',
          fieldType: BasicField.Table,
          columns: [
            { _id: 'col1', title: 'Name' },
            { _id: 'col2', title: 'Age' },
          ],
        } as ITableFieldSchema,
        {
          _id: '2',
          title: 'Table of Hobbies',
          fieldType: BasicField.Table,
          columns: [
            { _id: 'col3', title: 'Hobby' },
            { _id: 'col4', title: 'Years' },
          ],
        } as ITableFieldSchema,
      ]
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Table,
          answer: [
            { col1: 'Alice', col2: '30' },
            { col1: 'Bob', col2: '25' },
          ],
        } as TableResponseV3,
        '2': {
          fieldType: BasicField.Table,
          answer: [
            { col3: 'Swimming', col4: '5' },
            { col3: 'Reading', col4: '10' },
          ],
        } as TableResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        {
          question: '[Table] Table of Name and Age (Name; Age)',
          answer: 'Alice; 30',
        },
        {
          question: '[Table] Table of Name and Age (Name; Age)',
          answer: 'Bob; 25',
        },
        {
          question: '[Table] Table of Hobbies (Hobby; Years)',
          answer: 'Swimming; 5',
        },
        {
          question: '[Table] Table of Hobbies (Hobby; Years)',
          answer: 'Reading; 10',
        },
      ])
    })

    it('should handle checkbox fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Checkbox',
          fieldType: BasicField.Checkbox,
        } as ICheckboxFieldSchema,
      ]
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Checkbox,
          answer: {
            value: ['Option 1', 'Option 2', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
            othersInput: 'Custom Option',
          },
        } as CheckboxResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        { question: 'Checkbox', answer: 'Option 1,Option 2,Custom Option' },
      ])
    })
  })

  it('should return an empty array when formFields is not iterable', () => {
    const formFields = null as unknown as FormFieldSchema[]
    const responses: FieldResponsesV3 = {
      '1': {
        fieldType: BasicField.ShortText,
        answer: 'Test answer',
      } as ShortTextResponseV3,
    }

    const result = getQuestionTitleAnswerString({ formFields, responses })

    expect(result).toEqual([])
  })

  it('should return an empty array when responses is undefined or null', () => {
    const formFields: FormFieldSchema[] = [
      {
        _id: '1',
        title: 'Short Text',
        fieldType: BasicField.ShortText,
      } as IShortTextFieldSchema,
    ]

    const undefinedResult = getQuestionTitleAnswerString({
      formFields,
      responses: undefined as unknown as FieldResponsesV3,
    })
    expect(undefinedResult).toEqual([])

    const nullResult = getQuestionTitleAnswerString({
      formFields,
      responses: null as unknown as FieldResponsesV3,
    })
    expect(nullResult).toEqual([])
  })
})
