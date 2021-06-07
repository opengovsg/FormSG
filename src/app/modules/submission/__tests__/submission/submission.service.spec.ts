import { ObjectId } from 'bson'
import { times } from 'lodash'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import getSubmissionModel from 'src/app/models/submission.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import MailService from 'src/app/services/mail/mail.service'
import { createQueryWithDateParam } from 'src/app/utils/date'
import * as LogicUtil from 'src/shared/util/logic'
import {
  AutoReplyOptions,
  BasicField,
  IAttachmentInfo,
  IEmailFormSchema,
  IEmailSubmissionSchema,
  IEncryptedFormSchema,
  IEncryptedSubmissionSchema,
  IFormSchema,
  IPreventSubmitLogicSchema,
  ISubmissionSchema,
  LogicType,
  ResponseMode,
  SubmissionType,
} from 'src/types'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
  generateProcessedSingleAnswerResponse,
  generateSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  ConflictError,
  ProcessingError,
  SendEmailConfirmationError,
  ValidateFieldError,
} from '../../submission.errors'
import { extractEmailConfirmationData } from '../../submission.utils'

jest.mock('src/app/services/mail/mail.service')
const MockMailService = mocked(MailService, true)

const Submission = getSubmissionModel(mongoose)

const MOCK_FORM_ID = new ObjectId().toHexString()
const MOCK_SUBMISSION = {
  _id: new ObjectId().toHexString(),
  form: MOCK_FORM_ID,
} as ISubmissionSchema
const MOCK_AUTOREPLY_DATA = [
  {
    question: 'Email',
    answerTemplate: ['a@abc.com'],
  },
]
const AUTOREPLY_OPTIONS_1: AutoReplyOptions = {
  hasAutoReply: true,
  autoReplySubject: 'subject1',
  autoReplySender: 'sender1',
  autoReplyMessage: 'message1',
  includeFormSummary: true,
}

const AUTOREPLY_OPTIONS_2: AutoReplyOptions = {
  hasAutoReply: true,
  autoReplySubject: 'subject2',
  autoReplySender: 'sender2',
  autoReplyMessage: 'message2',
  includeFormSummary: false,
}

const MOCK_EMAIL_1 = 'a@abc.com'
const MOCK_EMAIL_2 = 'b@abc.com'

const EXPECTED_AUTOREPLY_DATA_1 = {
  email: MOCK_EMAIL_1,
  subject: AUTOREPLY_OPTIONS_1.autoReplySubject,
  sender: AUTOREPLY_OPTIONS_1.autoReplySender,
  body: AUTOREPLY_OPTIONS_1.autoReplyMessage,
  includeFormSummary: AUTOREPLY_OPTIONS_1.includeFormSummary,
}

const EXPECTED_AUTOREPLY_DATA_2 = {
  email: MOCK_EMAIL_2,
  subject: AUTOREPLY_OPTIONS_2.autoReplySubject,
  sender: AUTOREPLY_OPTIONS_2.autoReplySender,
  body: AUTOREPLY_OPTIONS_2.autoReplyMessage,
  includeFormSummary: AUTOREPLY_OPTIONS_2.includeFormSummary,
}

const MOCK_ATTACHMENTS: IAttachmentInfo[] = [
  {
    filename: 'filename',
    content: Buffer.from('attachment1'),
    fieldId: new ObjectId().toHexString(),
  },
]

describe('submission.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())
  beforeEach(() => jest.clearAllMocks())

  describe('getProcessedResponses', () => {
    it('should return list of parsed responses for encrypted form submission successfully', async () => {
      // Arrange
      // Only mobile and email fields are parsed, since the other fields are
      // e2e encrypted from the browser.
      const mobileField = generateDefaultField(BasicField.Mobile)
      const emailField = generateDefaultField(BasicField.Email)
      // Add answers to both mobile and email fields
      const mobileResponse = generateSingleAnswerResponse(
        mobileField,
        '+6587654321',
      )
      const emailResponse = generateSingleAnswerResponse(
        emailField,
        'test@example.com',
      )

      const mobileProcessedResponse = generateProcessedSingleAnswerResponse(
        mobileField,
        '+6587654321',
      )
      const emailProcessedResponse = generateProcessedSingleAnswerResponse(
        emailField,
        'test@example.com',
      )

      // Act
      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField, emailField],
        } as unknown as IFormSchema,
        [mobileResponse, emailResponse],
      )

      // Assert
      const expectedParsed: ProcessedFieldResponse[] = [
        { ...mobileProcessedResponse, isVisible: true },
        { ...emailProcessedResponse, isVisible: true },
      ]
      // Should only have email and mobile fields for encrypted forms.
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedParsed)
    })

    it('should return list of parsed responses for email form submission successfully', async () => {
      // Arrange
      // Add answer to subset of field types
      const shortTextField = generateDefaultField(BasicField.ShortText)
      const decimalField = generateDefaultField(BasicField.Decimal)

      // Add answers to both mobile and email fields
      const shortTextResponse = generateSingleAnswerResponse(
        shortTextField,
        'the quick brown fox jumps over the lazy dog',
      )
      const decimalResponse = generateSingleAnswerResponse(
        decimalField,
        '3.142',
      )

      const shortTextProcessedResponse = generateProcessedSingleAnswerResponse(
        shortTextField,
        'the quick brown fox jumps over the lazy dog',
      )
      const decimalProcessedResponse = generateProcessedSingleAnswerResponse(
        decimalField,
        '3.142',
      )

      // Act
      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Email,
          form_fields: [shortTextField, decimalField],
        } as unknown as IFormSchema,
        [shortTextResponse, decimalResponse],
      )

      // Assert
      const expectedParsed: ProcessedFieldResponse[] = [
        { ...shortTextProcessedResponse, isVisible: true },
        { ...decimalProcessedResponse, isVisible: true },
      ]

      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedParsed)
    })

    it('should return error when email form has more fields than responses', async () => {
      // Arrange
      const extraField = generateDefaultField(BasicField.Mobile)

      // Act + Assert

      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Email,
          form_fields: [extraField],
        } as unknown as IEmailFormSchema,
        [],
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ConflictError('Some form fields are missing'),
      )
    })

    it('should return error when encrypt form has more fields than responses', async () => {
      // Arrange
      const extraField = generateDefaultField(BasicField.Mobile)

      // Act + Assert

      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Encrypt,
          form_fields: [extraField],
        } as unknown as IEncryptedFormSchema,
        [],
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ConflictError('Some form fields are missing'),
      )
    })
    it('should allow responses for encrypt mode hidden fields', async () => {
      // Arrange
      // Only check for mobile and email fields, since the other fields are
      // e2e encrypted from the browser.
      const mobileField = generateDefaultField(BasicField.Mobile)
      const emailField = generateDefaultField(BasicField.Email)
      // Add answers to both mobile and email fields
      const mobileResponse = generateSingleAnswerResponse(
        mobileField,
        '+6587654321',
      )

      const emailResponse = generateSingleAnswerResponse(
        emailField,
        'test@example.com',
      )

      const mobileProcessedResponse = generateProcessedSingleAnswerResponse(
        mobileField,
        '+6587654321',
      )
      mobileProcessedResponse.isVisible = false

      const emailProcessedResponse = generateProcessedSingleAnswerResponse(
        emailField,
        'test@example.com',
      )
      emailProcessedResponse.isVisible = false

      // Act
      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField, emailField],
        } as unknown as IFormSchema,
        [mobileResponse, emailResponse],
      )

      // Assert
      const expectedParsed: ProcessedFieldResponse[] = [
        { ...mobileProcessedResponse, isVisible: true }, //getProcessedResponses sets isVisible to be true for encrypt mode
        { ...emailProcessedResponse, isVisible: true },
      ]
      // Should only have email and mobile fields for encrypted forms.
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedParsed)
    })

    it('should return error when any responses are not valid for encrypted form submission', async () => {
      // Arrange
      // Only mobile and email fields are parsed, since the other fields are
      // e2e encrypted from the browser.
      const mobileField = generateDefaultField(BasicField.Mobile)
      const mobileResponse = generateSingleAnswerResponse(
        mobileField,
        'invalid',
      )

      // Act + Assert
      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField],
        } as unknown as IEncryptedFormSchema,
        [mobileResponse],
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should return error when any responses are not valid for email form submission', async () => {
      // Arrange
      // Set NRIC field in form as required.
      const nricField = generateDefaultField(BasicField.Nric)
      const nricResponse = generateSingleAnswerResponse(nricField, 'invalid')

      // Act + Assert
      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Email,
          form_fields: [nricField],
        } as unknown as IEmailFormSchema,
        [nricResponse],
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should return error when encrypted form submission is prevented by logic', async () => {
      // Arrange
      // Mock logic util to return non-empty to check if error is thrown
      jest
        .spyOn(LogicUtil, 'getLogicUnitPreventingSubmit')
        .mockReturnValueOnce({
          preventSubmitMessage: 'mock prevent submit',
          conditions: [],
          logicType: LogicType.PreventSubmit,
          _id: 'some id',
        } as unknown as IPreventSubmitLogicSchema)

      // Act + Assert
      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Encrypt,
          form_fields: [],
        } as unknown as IEncryptedFormSchema,
        [],
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ProcessingError('Submission prevented by form logic'),
      )
    })

    it('should return error when email form submission is prevented by logic', async () => {
      // Arrange
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

      // Act + Assert
      const actualResult = SubmissionService.getProcessedResponses(
        {
          responseMode: ResponseMode.Email,
          form_fields: [],
        } as unknown as IEmailFormSchema,
        [],
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ProcessingError('Submission prevented by form logic'),
      )
    })
  })

  describe('getFormSubmissionsCount', () => {
    const countSpy = jest.spyOn(Submission, 'countDocuments')
    const MOCK_FORM_ID = new ObjectId()

    beforeEach(async () => {
      await dbHandler.clearCollection(Submission.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return correct all form counts when not providing date range', async () => {
      // Arrange
      // Insert 4 submissions
      const expectedSubmissionCount = 4
      const subPromises = times(expectedSubmissionCount, () =>
        Submission.create({
          submissionType: SubmissionType.Encrypt,
          form: MOCK_FORM_ID,
          encryptedContent: 'some random encrypted content',
          version: 1,
          responseHash: 'hash',
          responseSalt: 'salt',
        }),
      )
      await Promise.all(subPromises)

      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        MOCK_FORM_ID.toHexString(),
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedSubmissionCount)
    })

    it('should return correct form counts in range when date range is provided', async () => {
      // Arrange
      const expectedSubmissionCount = 4
      // Insert submissions created now.
      const subPromisesNow = times(2, () =>
        Submission.create<IEncryptedSubmissionSchema>({
          submissionType: SubmissionType.Encrypt,
          form: MOCK_FORM_ID,
          version: 1,
          encryptedContent: 'some random encrypted content',
        }),
      )
      // Insert submissions created in 1 Jan 2019.
      const subPromises2019 = times(expectedSubmissionCount, () =>
        Submission.create<IEmailSubmissionSchema>({
          form: MOCK_FORM_ID,
          submissionType: SubmissionType.Email,
          responseHash: 'hash',
          responseSalt: 'salt',
          created: new Date('2019-01-01'),
          recipientEmails: [],
        }),
      )

      // Insert one more submission for defaultEmailForm in 2 January 2019.
      const subPromiseDayAfter = Submission.create<IEmailSubmissionSchema>({
        form: MOCK_FORM_ID,
        submissionType: SubmissionType.Email,
        responseHash: 'hash',
        responseSalt: 'salt',
        created: new Date('2019-01-02'),
        recipientEmails: [],
      })

      // Execute creation in DB.
      await Promise.all([
        ...subPromises2019,
        ...subPromisesNow,
        subPromiseDayAfter,
      ])

      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        MOCK_FORM_ID.toHexString(),
        { startDate: '2019-01-01', endDate: '2019-01-01' },
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      // Should only return submissions on given day.
      expect(actualResult._unsafeUnwrap()).toEqual(expectedSubmissionCount)
    })

    it('should return 0 form count when no forms are in range', async () => {
      // Arrange
      // Insert submissions created 2019-12-12
      const subPromises = times(2, () =>
        Submission.create<IEncryptedSubmissionSchema>({
          submissionType: SubmissionType.Encrypt,
          form: MOCK_FORM_ID,
          version: 1,
          encryptedContent: 'some random encrypted content',
          created: new Date('2019-12-12'),
        }),
      )

      await Promise.all(subPromises)

      // Act
      const queryDateRange = { startDate: '2020-01-01', endDate: '2020-01-01' }
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        MOCK_FORM_ID.toHexString(),
        queryDateRange,
      )

      // Assert
      expect(countSpy).toHaveBeenCalledWith({
        form: MOCK_FORM_ID.toHexString(),
        ...createQueryWithDateParam(
          queryDateRange.startDate,
          queryDateRange.endDate,
        ),
      })
      expect(actualResult.isOk()).toEqual(true)
      // No submissions expected to be returned..
      expect(actualResult._unsafeUnwrap()).toEqual(0)
    })

    it('should return MalformedParametersError when date range provided is malformed', async () => {
      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        MOCK_FORM_ID.toHexString(),
        { startDate: 'some malformed start date', endDate: '2020-01-01' },
      )

      // Assert
      expect(countSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        MalformedParametersError,
      )
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      countSpy.mockImplementationOnce(
        () =>
          ({
            exec: () => Promise.reject(new Error('boom')),
          } as unknown as mongoose.Query<any>),
      )

      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        MOCK_FORM_ID.toHexString(),
      )

      // Assert
      expect(countSpy).toHaveBeenCalledWith({
        form: MOCK_FORM_ID.toHexString(),
      })
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('sendEmailConfirmations', () => {
    it('should call mail service and return true when email confirmations are sent successfully', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_1,
          },
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_2,
          },
        ],
      } as unknown as IFormSchema
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: true,
        },
        {
          status: 'fulfilled',
          value: true,
        },
      ])

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![0]._id,
            answer: MOCK_EMAIL_1,
          }),
        },
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![1]._id,
            answer: MOCK_EMAIL_2,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
      })

      const expectedAutoReplyData = [
        EXPECTED_AUTOREPLY_DATA_1,
        EXPECTED_AUTOREPLY_DATA_2,
      ]

      expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith({
        form: mockForm,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
        autoReplyMailDatas: expectedAutoReplyData,
      })
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('should not call mail service when there are no email fields', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [generateDefaultField(BasicField.Number)],
      } as unknown as IFormSchema

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Number, {
            _id: mockForm.form_fields![0]._id,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )

      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
      })

      expect(MockMailService.sendAutoReplyEmails).not.toHaveBeenCalled()
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('should not call mail service when there are email fields but all without email confirmation', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: { hasAutoReply: false },
          },
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: { hasAutoReply: false },
          },
        ],
      } as unknown as IFormSchema

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![0]._id,
            answer: MOCK_EMAIL_1,
          }),
        },
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![1]._id,
            answer: MOCK_EMAIL_2,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
      })

      expect(MockMailService.sendAutoReplyEmails).not.toHaveBeenCalled()
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('should call mail service when there is a mix of email fields with and without confirmation', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_1,
          },
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: { hasAutoReply: false },
          },
        ],
      } as unknown as IFormSchema
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: true,
        },
      ])

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![0]._id,
            answer: MOCK_EMAIL_1,
          }),
        },
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![1]._id,
            answer: MOCK_EMAIL_2,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
      })

      const expectedAutoReplyData = [EXPECTED_AUTOREPLY_DATA_1]

      expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith({
        form: mockForm,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
        autoReplyMailDatas: expectedAutoReplyData,
      })
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('should call mail service with responsesData empty when autoReplyData is undefined', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_1,
          },
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_2,
          },
        ],
      } as unknown as IFormSchema
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: true,
        },
        {
          status: 'fulfilled',
          value: true,
        },
      ])

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![0]._id,
            answer: MOCK_EMAIL_1,
          }),
        },
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![1]._id,
            answer: MOCK_EMAIL_2,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: undefined,
      })

      const expectedAutoReplyData = [
        EXPECTED_AUTOREPLY_DATA_1,
        EXPECTED_AUTOREPLY_DATA_2,
      ]

      expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith({
        form: mockForm,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: [],
        autoReplyMailDatas: expectedAutoReplyData,
      })
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('should call mail service with attachments undefined when there are no attachments', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_1,
          },
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_2,
          },
        ],
      } as unknown as IFormSchema
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: true,
        },
        {
          status: 'fulfilled',
          value: true,
        },
      ])

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![0]._id,
            answer: MOCK_EMAIL_1,
          }),
        },
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![1]._id,
            answer: MOCK_EMAIL_2,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: undefined,
        responsesData: MOCK_AUTOREPLY_DATA,
      })

      const expectedAutoReplyData = [
        EXPECTED_AUTOREPLY_DATA_1,
        EXPECTED_AUTOREPLY_DATA_2,
      ]

      expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith({
        form: mockForm,
        submission: MOCK_SUBMISSION,
        attachments: undefined,
        responsesData: MOCK_AUTOREPLY_DATA,
        autoReplyMailDatas: expectedAutoReplyData,
      })
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('should return SendEmailConfirmationError when mail service errors', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_1,
          },
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_2,
          },
        ],
      } as unknown as IFormSchema
      MockMailService.sendAutoReplyEmails.mockImplementationOnce(() =>
        Promise.reject('rejected'),
      )

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![0]._id,
            answer: MOCK_EMAIL_1,
          }),
        },
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![1]._id,
            answer: MOCK_EMAIL_2,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
      })

      const expectedAutoReplyData = [
        EXPECTED_AUTOREPLY_DATA_1,
        EXPECTED_AUTOREPLY_DATA_2,
      ]

      expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith({
        form: mockForm,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
        autoReplyMailDatas: expectedAutoReplyData,
      })
      expect(result._unsafeUnwrapErr()).toEqual(
        new SendEmailConfirmationError(),
      )
    })

    it('should return SendEmailConfirmationError when any email confirmations fail', async () => {
      const mockForm = {
        _id: MOCK_FORM_ID,
        form_fields: [
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_1,
          },
          {
            ...generateDefaultField(BasicField.Email),
            autoReplyOptions: AUTOREPLY_OPTIONS_2,
          },
        ],
      } as unknown as IFormSchema
      const mockReason = 'reason'
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: true,
        },
        {
          status: 'rejected',
          reason: mockReason,
        },
      ])

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![0]._id,
            answer: MOCK_EMAIL_1,
          }),
        },
        {
          ...generateNewSingleAnswerResponse(BasicField.Email, {
            _id: mockForm.form_fields![1]._id,
            answer: MOCK_EMAIL_2,
          }),
        },
      ]
      const autoReplyData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        autoReplyData,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
      })

      const expectedAutoReplyData = [
        EXPECTED_AUTOREPLY_DATA_1,
        EXPECTED_AUTOREPLY_DATA_2,
      ]

      expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith({
        form: mockForm,
        submission: MOCK_SUBMISSION,
        attachments: MOCK_ATTACHMENTS,
        responsesData: MOCK_AUTOREPLY_DATA,
        autoReplyMailDatas: expectedAutoReplyData,
      })
      expect(result._unsafeUnwrapErr()).toEqual(
        new SendEmailConfirmationError(),
      )
    })
  })
})
