/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  generateDefaultField,
  generateNewAttachmentResponse,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { readFileSync } from 'fs'
import { clone, omit, times } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync } from 'neverthrow'
import { PassThrough, Transform } from 'stream'

import { aws } from 'src/app/config/config'
import getPendingSubmissionModel from 'src/app/models/pending_submission.server.model'
import getSubmissionModel, {
  getEncryptSubmissionModel,
} from 'src/app/models/submission.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import { InvalidSubmissionIdError } from 'src/app/modules/feedback/feedback.errors'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import MailService from 'src/app/services/mail/mail.service'
import { createQueryWithDateParam } from 'src/app/utils/date'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'
import {
  IAttachmentInfo,
  IFormDocument,
  IPaymentSchema,
  IPopulatedForm,
  ISubmissionSchema,
  StorageModeSubmissionCursorData,
  StorageModeSubmissionData,
} from 'src/types'

import {
  AutoReplyOptions,
  BasicField,
  FormResponseMode,
  SubmissionId,
  SubmissionMetadata,
  SubmissionType,
} from '../../../../../shared/types'
import { PaymentNotFoundError } from '../../payments/payments.errors'
import * as PaymentsService from '../../payments/payments.service'
import {
  AttachmentTooLargeError,
  InvalidFileExtensionError,
  PendingSubmissionNotFoundError,
  SendEmailConfirmationError,
  SubmissionNotFoundError,
} from '../submission.errors'
import { extractEmailConfirmationData } from '../submission.utils'

jest.mock('src/app/services/mail/mail.service')
const MockMailService = jest.mocked(MailService)

const PendingSubmission = getPendingSubmissionModel(mongoose)
const Submission = getSubmissionModel(mongoose)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

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
        Submission.create({
          submissionType: SubmissionType.Encrypt,
          form: MOCK_FORM_ID,
          version: 1,
          encryptedContent: 'some random encrypted content',
        }),
      )
      // Insert submissions created in 1 Jan 2019.
      const subPromises2019 = times(expectedSubmissionCount, () =>
        Submission.create({
          form: MOCK_FORM_ID,
          submissionType: SubmissionType.Email,
          responseHash: 'hash',
          responseSalt: 'salt',
          created: new Date('2019-01-01'),
          recipientEmails: [],
        }),
      )

      // Insert one more submission for defaultEmailForm in 2 January 2019.
      const subPromiseDayAfter = Submission.create({
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
        Submission.create({
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
          } as unknown as mongoose.Query<any, any>),
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
      } as unknown as IFormDocument
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: ok(true),
        },
        {
          status: 'fulfilled',
          value: ok(true),
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
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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
      } as unknown as IPopulatedForm

      const responses = [
        {
          ...generateNewSingleAnswerResponse(BasicField.Number, {
            _id: mockForm.form_fields![0]._id,
          }),
        },
      ]
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )

      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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
      } as unknown as IPopulatedForm

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
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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
      } as unknown as IPopulatedForm
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: ok(true),
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
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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
      } as unknown as IPopulatedForm
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: ok(true),
        },
        {
          status: 'fulfilled',
          value: ok(true),
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
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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
      } as unknown as IPopulatedForm
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: ok(true),
        },
        {
          status: 'fulfilled',
          value: ok(true),
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
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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
      } as unknown as IPopulatedForm
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
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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
      } as unknown as IPopulatedForm
      const mockReason = 'reason'
      MockMailService.sendAutoReplyEmails.mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: ok(true),
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
      const recipientData = extractEmailConfirmationData(
        responses,
        mockForm.form_fields,
      )
      const result = await SubmissionService.sendEmailConfirmations({
        form: mockForm,
        recipientData,
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

  describe('doesSubmissionIdExist', () => {
    const MOCK_SUBMISSION_ID = MOCK_SUBMISSION._id

    beforeEach(async () => {
      await dbHandler.clearCollection(Submission.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return true if submissionId already exists', async () => {
      await Submission.create({
        _id: MOCK_SUBMISSION_ID,
        submissionType: SubmissionType.Encrypt,
        form: MOCK_FORM_ID,
        encryptedContent: 'some random encrypted content',
        version: 1,
        responseHash: 'hash',
        responseSalt: 'salt',
      })

      const actualResult = await SubmissionService.doesSubmissionIdExist(
        MOCK_SUBMISSION_ID,
      )

      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
    })

    it('should return false if submissionId does not exist', async () => {
      await Submission.create({
        _id: MOCK_SUBMISSION_ID,
        submissionType: SubmissionType.Encrypt,
        form: MOCK_FORM_ID,
        encryptedContent: 'some random encrypted content',
        version: 1,
        responseHash: 'hash',
        responseSalt: 'salt',
      })

      const actualResult = await SubmissionService.doesSubmissionIdExist(
        new ObjectId().toHexString(),
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidSubmissionIdError,
      )
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      const existSpy = jest.spyOn(Submission, 'exists')
      existSpy.mockImplementationOnce(() => Promise.reject(new Error('boom')))

      const actualResult = await SubmissionService.doesSubmissionIdExist(
        MOCK_SUBMISSION_ID,
      )

      expect(existSpy).toHaveBeenCalledWith({
        _id: MOCK_SUBMISSION_ID,
      })
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('getSubmissionMetadata', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    it('should return metadata successfully', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const expectedMetadata: SubmissionMetadata = {
        number: 200,
        refNo: mockSubmissionId as SubmissionId,
        submissionTime: 'some submission time',
        payments: {
          paymentAmt: 0,
          email: '',
          payoutDate: null,
          transactionFee: null,
        },
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findSingleMetadata')
        .mockResolvedValueOnce(expectedMetadata)

      // Act
      const actualResult = await SubmissionService.getSubmissionMetadata(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockSubmissionId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedMetadata)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, mockSubmissionId)
    })

    it('should return null when given submissionId is not valid', async () => {
      // Arrange
      const invalidSubmissionId = 'not an id at all'

      // Act
      const actualResult = await SubmissionService.getSubmissionMetadata(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        invalidSubmissionId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(null)
    })

    it('should return null when query returns null', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findSingleMetadata')
        .mockResolvedValueOnce(null)

      // Act
      const actualResult = await SubmissionService.getSubmissionMetadata(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockSubmissionId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(null)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, mockSubmissionId)
    })

    it('should return DatabaseError when database error occurs', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockErrorString = 'some database error message'
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findSingleMetadata')
        .mockRejectedValueOnce(new Error(mockErrorString))

      // Act
      const actualResult = await SubmissionService.getSubmissionMetadata(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockSubmissionId,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, mockSubmissionId)
    })
  })

  describe('getSubmissionMetadataList', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    it('should return metadata list successfully without page param', async () => {
      // Arrange
      const expectedResult = {
        metadata: [
          {
            number: 200,
            refNo: new ObjectId().toHexString(),
            submissionTime: 'some submission time',
          },
        ] as SubmissionMetadata[],
        count: 1,
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findAllMetadataByFormId')
        .mockResolvedValueOnce(expectedResult)

      // Act
      const actualResult = await SubmissionService.getSubmissionMetadataList(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, {
        page: undefined,
      })
    })

    it('should return metadata list successfully with page param', async () => {
      // Arrange
      const mockPageNumber = 200
      const expectedResult = {
        metadata: [
          {
            number: 9,
            refNo: new ObjectId().toHexString(),
            submissionTime: 'another submission time',
          },
        ] as SubmissionMetadata[],
        count: 1,
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findAllMetadataByFormId')
        .mockResolvedValueOnce(expectedResult)

      // Act
      const actualResult = await SubmissionService.getSubmissionMetadataList(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockPageNumber,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, {
        page: mockPageNumber,
      })
    })

    it('should return DatabaseError when database error occurs', async () => {
      // Arrange
      const mockErrorString = 'some database error message'
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findAllMetadataByFormId')
        .mockRejectedValueOnce(new Error(mockErrorString))

      // Act
      const actualResult = await SubmissionService.getSubmissionMetadataList(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, {
        page: undefined,
      })
    })
  })

  describe('getEncryptedSubmissionData', () => {
    it('should return submission data successfully', async () => {
      // Arrange
      const expected = {
        submissionType: SubmissionType.Encrypt,
        encryptedContent: 'mock encrypted content',
        verifiedContent: 'mock verified content',
        attachmentMetadata: new Map([
          ['key1', 'objectPath1'],
          ['key2', 'objectPath2'],
        ]),
        created: new Date(),
      } as StorageModeSubmissionData

      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'findEncryptedSubmissionById')
        .mockResolvedValueOnce(expected)
      const mockFormId = new ObjectId().toHexString()
      const mockSubmissionId = new ObjectId().toHexString()

      // Act
      const actualResult = await SubmissionService.getEncryptedSubmissionData(
        FormResponseMode.Encrypt,

        mockFormId,
        mockSubmissionId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expected)
      expect(getSubmissionSpy).toHaveBeenCalledWith(
        mockFormId,
        mockSubmissionId,
      )
    })

    it('should return SubmissionNotFoundError when submissionId does not exist in the database', async () => {
      // Arrange
      // Return null submission.
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'findEncryptedSubmissionById')
        .mockResolvedValueOnce(null)
      const mockFormId = new ObjectId().toHexString()
      const mockSubmissionId = new ObjectId().toHexString()

      // Act
      const actualResult = await SubmissionService.getEncryptedSubmissionData(
        FormResponseMode.Encrypt,
        mockFormId,
        mockSubmissionId,
      )

      // Assert
      // Should be error.
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new SubmissionNotFoundError(
          'Unable to find encrypted submission from database',
        ),
      )
      expect(getSubmissionSpy).toHaveBeenCalledWith(
        mockFormId,
        mockSubmissionId,
      )
    })

    it('should return DatabaseError when error occurs during query', async () => {
      // Arrange
      // Return error when querying for submission.
      const mockErrorString = 'some error'
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'findEncryptedSubmissionById')
        .mockRejectedValueOnce(new Error(mockErrorString))
      const mockFormId = new ObjectId().toHexString()
      const mockSubmissionId = new ObjectId().toHexString()

      // Act
      const actualResult = await SubmissionService.getEncryptedSubmissionData(
        FormResponseMode.Encrypt,
        mockFormId,
        mockSubmissionId,
      )

      // Assert
      // Should be error.
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(getSubmissionSpy).toHaveBeenCalledWith(
        mockFormId,
        mockSubmissionId,
      )
    })
  })

  describe('getSubmissionCursor', () => {
    it('should return cursor successfully when date range is not provided', async () => {
      // Arrange
      const mockCursor = jest.fn() as unknown as mongoose.QueryCursor<any>
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'getSubmissionCursorByFormId')
        .mockReturnValueOnce(mockCursor)
      const mockFormId = new ObjectId().toHexString()

      // Act
      const actualResult = SubmissionService.getSubmissionCursor(
        FormResponseMode.Encrypt,
        mockFormId,
      )

      // Assert
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledWith(mockFormId, {})
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockCursor)
    })

    it('should return cursor successfully when date range is provided', async () => {
      // Arrange
      const mockCursor = jest.fn() as unknown as mongoose.QueryCursor<any>
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'getSubmissionCursorByFormId')
        .mockReturnValueOnce(mockCursor)
      const mockFormId = new ObjectId().toHexString()
      const mockDateRange = {
        startDate: '2020-01-01',
        endDate: '2020-10-10',
      }

      // Act
      const actualResult = SubmissionService.getSubmissionCursor(
        FormResponseMode.Encrypt,
        mockFormId,
        mockDateRange,
      )

      // Assert
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledWith(mockFormId, mockDateRange)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockCursor)
    })

    it('should return MalformedParametersError when start date is invalid', async () => {
      // Arrange
      const getSubmissionSpy = jest.spyOn(
        EncryptSubmission,
        'getSubmissionCursorByFormId',
      )

      const mockFormId = new ObjectId().toHexString()
      const invalidDateRange = {
        startDate: 'invalid',
        endDate: '2020-10-10',
      }

      // Act
      const actualResult = SubmissionService.getSubmissionCursor(
        FormResponseMode.Encrypt,
        mockFormId,
        invalidDateRange,
      )

      // Assert
      expect(getSubmissionSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError('Malformed date parameter'),
      )
    })

    it('should return MalformedParametersError when end date is invalid', async () => {
      // Arrange
      const getSubmissionSpy = jest.spyOn(
        EncryptSubmission,
        'getSubmissionCursorByFormId',
      )

      const mockFormId = new ObjectId().toHexString()
      const invalidDateRange = {
        startDate: '2019-12-12',
        endDate: 'not-a-date',
      }

      // Act
      const actualResult = SubmissionService.getSubmissionCursor(
        FormResponseMode.Encrypt,
        mockFormId,
        invalidDateRange,
      )

      // Assert
      expect(getSubmissionSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError('Malformed date parameter'),
      )
    })
  })

  describe('transformAttachmentMetaStream', () => {
    const MOCK_SUB_CURSOR_DATA_1: Partial<StorageModeSubmissionCursorData> = {
      attachmentMetadata: { mockId1: 'mock metadata 1' },
    }
    const MOCK_SUB_CURSOR_DATA_2: Partial<StorageModeSubmissionCursorData> = {
      attachmentMetadata: { mockId2: 'mock metadata 2' },
    }

    const EMPTY_METADATA = {
      attachmentMetadata: {},
    }

    beforeEach(() => jest.resetAllMocks())

    it('should successfully transform metadata to signed URL', async () => {
      // Arrange
      const mockFirstS3Url =
        'http://localhost:4566/local-attachment-bucket/path/to/attachment/1?AWSAccessKeyId=fakeKey&Expires=1605248842&Signature=some_signature'
      const mockSecondS3Url =
        'http://localhost:4566/local-attachment-bucket/path/to/attachment/2?AWSAccessKeyId=fakeKey2&Expires=1605248842&Signature=some_signature'
      const mockInput = new PassThrough()
      const expectedExpiry = 20

      const actualTransformedData: any[] = []

      const awsSpy = jest
        .spyOn(aws.s3, 'getSignedUrl')
        // @ts-ignore
        .mockImplementationOnce((_operation, _params, callback) =>
          callback(null, mockFirstS3Url),
        )
        // @ts-ignore
        .mockImplementationOnce((_operation, _params, callback) =>
          callback(null, mockSecondS3Url),
        )

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          SubmissionService.transformAttachmentMetaStream({
            enabled: true,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_2))

      // Assert
      // Data from end of pipe should have their attachment metadatas replaced
      // by s3 urls.
      expect(actualTransformedData).toEqual([
        {
          attachmentMetadata: {
            mockId1: mockFirstS3Url,
          },
        },
        {
          attachmentMetadata: {
            mockId2: mockSecondS3Url,
          },
        },
      ])
      // Check external service calls.
      expect(awsSpy).toHaveBeenNthCalledWith(
        1,
        'getObject',
        {
          Bucket: aws.attachmentS3Bucket,
          Key: MOCK_SUB_CURSOR_DATA_1.attachmentMetadata!['mockId1'],
          Expires: expectedExpiry,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect.any(Function),
      )
      expect(awsSpy).toHaveBeenNthCalledWith(
        2,
        'getObject',
        {
          Bucket: aws.attachmentS3Bucket,
          Key: MOCK_SUB_CURSOR_DATA_2.attachmentMetadata!['mockId2'],
          Expires: expectedExpiry,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect.any(Function),
      )
    })

    it('should return empty data.attachmentMetadata when disabled', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const expectedExpiry = 400
      const actualTransformedData: any[] = []
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrl')

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          SubmissionService.transformAttachmentMetaStream({
            // Disabled pipeline.
            enabled: false,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))

      // Assert
      expect(actualTransformedData).toEqual([EMPTY_METADATA])
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return empty data.attachmentMetadata when nothing to transform', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrl')
      const expectedExpiry = 1

      const actualTransformedData: any[] = []

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          SubmissionService.transformAttachmentMetaStream({
            enabled: true,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', EMPTY_METADATA)

      // Assert
      expect(actualTransformedData).toEqual([EMPTY_METADATA])
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return empty data.attachmentMetadata when original metadata is undefined', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const expectedExpiry = 400
      const actualTransformedData: any[] = []
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrl')

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          SubmissionService.transformAttachmentMetaStream({
            enabled: true,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit event with empty object.
      mockInput.emit('data', {})

      // Assert
      expect(actualTransformedData).toEqual([EMPTY_METADATA])
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return error when stream errors occurs', async () => {
      // Arrange
      const expectedError = new Error('streams are being crossed right now!!!!')
      const expectedExpiry = 1000
      // Mock AWS S3 error.
      const awsSpy = jest
        .spyOn(aws.s3, 'getSignedUrl')
        // @ts-ignore
        .mockImplementationOnce((_operation, _params, callback) => {
          return callback(expectedError)
        })
      const mockInput = new PassThrough()

      // Act
      // Build (promisified) pipeline for testing.
      const streamPromise = new Promise((resolve, reject) => {
        mockInput
          .pipe(
            SubmissionService.transformAttachmentMetaStream({
              enabled: true,
              urlValidDuration: expectedExpiry,
            }),
          )
          .on('finish', resolve)
          .on('error', reject)
      })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_2))

      // Assert
      // Should reject since error is returned from callback.
      await expect(streamPromise).rejects.toEqual(expectedError)
      expect(awsSpy).toHaveBeenCalledWith(
        'getObject',
        {
          Bucket: aws.attachmentS3Bucket,
          Key: MOCK_SUB_CURSOR_DATA_2.attachmentMetadata!['mockId2'],
          Expires: expectedExpiry,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect.any(Function),
      )
    })
  })

  describe('addPaymentDataStream', () => {
    const MOCK_SUB_CURSOR_DATA_1: Partial<StorageModeSubmissionCursorData> = {
      encryptedContent: 'some encrypted content 1',
      paymentId: 'mockPaymentId1',
    }

    const MOCK_SUB_CURSOR_DATA_2: Partial<StorageModeSubmissionCursorData> = {
      encryptedContent: 'some encrypted content 2',
      paymentId: 'mockPaymentId2',
    }

    const MOCK_PAYMENT_1 = {
      _id: 'mockPaymentId1',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_1',
      status: 'succeeded',
      email: 'form@tech.gov.sg',
      amount: 3141,

      completedPayment: {
        paymentDate: new Date(1680770362473),
        transactionFee: 600,
        receiptUrl: 'https://some.random.url.com',
      },

      payout: {
        payoutId: 'po_MOCK_PAYOUT_ID_1',
        payoutDate: new Date(1680870362473),
      },
    } as IPaymentSchema

    const MOCK_SUBMISSION_PAYMENT_DTO_1 = {
      id: 'mockPaymentId1',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_1',
      email: 'form@tech.gov.sg',
      amount: 3141,
      status: 'succeeded',

      paymentDate: 'Thu, 6 Apr 2023, 04:39:22 PM',
      transactionFee: 600,
      receiptUrl: 'https://some.random.url.com',

      payoutId: 'po_MOCK_PAYOUT_ID_1',
      payoutDate: 'Fri, 7 Apr 2023',
    }

    const MOCK_PAYMENT_2 = {
      _id: 'mockPaymentId2',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_2',
      status: 'succeeded',
      email: 'open@tech.gov.sg',
      amount: 12345,

      completedPayment: {
        paymentDate: new Date(1680771362473),
        transactionFee: 123,
        receiptUrl: 'https://some.random.url-2.com',
      },

      payout: {
        payoutId: 'po_MOCK_PAYOUT_ID_2',
        payoutDate: new Date(1680871362473),
      },
    } as IPaymentSchema

    const MOCK_SUBMISSION_PAYMENT_DTO_2 = {
      id: 'mockPaymentId2',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_2',
      email: 'open@tech.gov.sg',
      amount: 12345,
      status: 'succeeded',

      paymentDate: 'Thu, 6 Apr 2023, 04:56:02 PM',
      transactionFee: 123,
      receiptUrl: 'https://some.random.url-2.com',

      payoutId: 'po_MOCK_PAYOUT_ID_2',
      payoutDate: 'Fri, 7 Apr 2023',
    }

    beforeEach(() => jest.resetAllMocks())

    it('should successfully transform payment id to submission payment DTO', async () => {
      // Arrange
      const mockInput = new PassThrough()

      const actualTransformedData: any[] = []

      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => okAsync(MOCK_PAYMENT_1 as IPaymentSchema))
        .mockImplementationOnce(() => okAsync(MOCK_PAYMENT_2 as IPaymentSchema))

      // Act
      // Build (promisified) pipeline for testing.
      const streamPromise = new Promise((resolve) => {
        mockInput
          .pipe(SubmissionService.addPaymentDataStream())
          .on('data', (data) => actualTransformedData.push(data))
          .on('end', resolve)
      })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_2))
      mockInput.end()
      await streamPromise

      // Assert
      // Data from end of pipe should have their paymentIds replaced by
      // submission payment objects.
      expect(actualTransformedData).toEqual([
        {
          ...omit(MOCK_SUB_CURSOR_DATA_1, 'paymentId'),
          payment: MOCK_SUBMISSION_PAYMENT_DTO_1,
        },
        {
          ...omit(MOCK_SUB_CURSOR_DATA_2, 'paymentId'),
          payment: MOCK_SUBMISSION_PAYMENT_DTO_2,
        },
      ])
      // Check external service calls.
      expect(findSpy).toHaveBeenNthCalledWith(
        1,
        MOCK_SUB_CURSOR_DATA_1.paymentId,
      )
      expect(findSpy).toHaveBeenNthCalledWith(
        2,
        MOCK_SUB_CURSOR_DATA_2.paymentId,
      )
    })

    it('should return empty payment when no payment id is present', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const findSpy = jest.spyOn(PaymentsService, 'findPaymentById')

      const actualTransformedData: any[] = []

      // Act
      // Build pipeline.
      mockInput
        .pipe(SubmissionService.addPaymentDataStream())
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', {})

      // Assert
      expect(actualTransformedData).toEqual([{}])
      expect(findSpy).not.toHaveBeenCalled()
    })

    it('should return original object without payment id when stream errors occurs', async () => {
      // Arrange
      const expectedError = new Error('streams are being crossed right now!!!!')
      // Mock database error.
      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => errAsync(expectedError))
      const mockInput = new PassThrough()

      const actualTransformedData: any[] = []

      // Act
      // Build (promisified) pipeline for testing.
      const streamPromise = new Promise((resolve) => {
        mockInput
          .pipe(SubmissionService.addPaymentDataStream())
          .on('data', (data) => actualTransformedData.push(data))
          .on('end', resolve)
      })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))
      mockInput.end()
      await streamPromise

      // Assert
      // Data from end of pipe should have their paymentIds replaced by
      // submission payment objects.
      expect(actualTransformedData).toEqual([
        omit(MOCK_SUB_CURSOR_DATA_1, 'paymentId'),
      ])
      // Check external service calls.
      expect(findSpy).toHaveBeenNthCalledWith(
        1,
        MOCK_SUB_CURSOR_DATA_1.paymentId,
      )
    })
  })

  describe('getSubmissionPaymentDto', () => {
    const MOCK_PAYMENT_ID = 'mockPaymentId'

    it('should return submission payment data successfully', async () => {
      // Arrange
      const payment = {
        _id: MOCK_PAYMENT_ID,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID',
        status: 'succeeded',
        email: 'form@tech.gov.sg',
        amount: 3141,

        completedPayment: {
          paymentDate: new Date(1680766919),
          transactionFee: 600,
          receiptUrl: 'https://some.random.url.com',
        },

        payout: {
          payoutId: 'po_MOCK_PAYOUT_ID',
          payoutDate: new Date(1681766919),
        },
      } as IPaymentSchema

      const expected = {
        id: MOCK_PAYMENT_ID,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID',
        email: 'form@tech.gov.sg',
        amount: 3141,
        status: 'succeeded',

        paymentDate: 'Tue, 20 Jan 1970, 06:22:46 PM',
        transactionFee: 600,
        receiptUrl: 'https://some.random.url.com',

        payoutId: 'po_MOCK_PAYOUT_ID',
        payoutDate: 'Tue, 20 Jan 1970',
      }

      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => okAsync(payment))

      // Act
      const actualResult = await SubmissionService.getSubmissionPaymentDto(
        MOCK_PAYMENT_ID,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expected)
      expect(findSpy).toHaveBeenCalledWith(MOCK_PAYMENT_ID)
    })

    it('should return PaymentNotFoundError when payment does not exist in the database', async () => {
      // Arrange
      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => errAsync(new PaymentNotFoundError()))

      // Act
      const actualResult = await SubmissionService.getSubmissionPaymentDto(
        MOCK_PAYMENT_ID,
      )

      // Assert
      // Should be error.
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new PaymentNotFoundError(),
      )
      expect(findSpy).toHaveBeenCalledWith(MOCK_PAYMENT_ID)
    })
  })

  describe('copyPendingSubmissionToSubmissions', () => {
    const MOCK_PENDING_SUBMISSION_ID = MOCK_SUBMISSION._id

    const MOCK_PENDING_SUBMISSION = {
      _id: MOCK_PENDING_SUBMISSION_ID,
      submissionType: SubmissionType.Encrypt,
      form: MOCK_FORM_ID,
      encryptedContent: 'some random encrypted content',
      version: 1,
      responseHash: 'hash',
      responseSalt: 'salt',
    }

    beforeEach(async () => {
      await dbHandler.clearCollection(PendingSubmission.collection.name)
      await dbHandler.clearCollection(Submission.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return a submission document with the same ObjectID if copying from pending submissions to submissions was successful', async () => {
      // Arrange
      const pendingSubmission = await PendingSubmission.create(
        MOCK_PENDING_SUBMISSION,
      )

      // Act
      const session = await mongoose.startSession()
      const result = await SubmissionService.copyPendingSubmissionToSubmissions(
        MOCK_PENDING_SUBMISSION_ID,
        session,
      )
      session.endSession()

      //Assert
      expect(result.isOk()).toEqual(true)

      const submission = result._unsafeUnwrap()
      Object.keys(pendingSubmission).forEach((key) => {
        if (['created', 'lastModified'].includes(key)) return
        expect(submission.get(key)).toEqual(pendingSubmission.get(key))
      })
    })

    it('should return a submission document with a different ObjectID if an ObjectID collision occurs while copying the pending submission to the submissions collection', async () => {
      // Arrange
      const pendingSubmission = await PendingSubmission.create(
        MOCK_PENDING_SUBMISSION,
      )
      await Submission.create(MOCK_PENDING_SUBMISSION)

      // Act
      const session = await mongoose.startSession()
      const result = await SubmissionService.copyPendingSubmissionToSubmissions(
        MOCK_PENDING_SUBMISSION_ID,
        session,
      )
      session.endSession()

      // Assert
      expect(result.isOk()).toEqual(true)

      const submission = result._unsafeUnwrap()
      // Explicitly check the '_id' field to be different
      expect(submission.get('_id')).not.toEqual(pendingSubmission._id)
      Object.keys(pendingSubmission).forEach((key) => {
        if (['_id', 'created', 'lastModified'].includes(key)) return
        expect(submission.get(key)).toEqual(pendingSubmission.get(key))
      })
    })

    it('should return PendingSubmissionNotFoundError if pendingSubmissionId does not exist', async () => {
      // Act
      const session = await mongoose.startSession()
      const result = await SubmissionService.copyPendingSubmissionToSubmissions(
        new ObjectId().toHexString(),
        session,
      )
      session.endSession()

      // Assert
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PendingSubmissionNotFoundError,
      )
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const findSpy = jest.spyOn(PendingSubmission, 'findById')
      findSpy.mockImplementationOnce(
        () =>
          ({
            session: () => Promise.reject(new Error('boom')),
          } as unknown as mongoose.Query<any, any>),
      )

      // Act
      const session = await mongoose.startSession()
      const result = await SubmissionService.copyPendingSubmissionToSubmissions(
        MOCK_PENDING_SUBMISSION_ID,
        session,
      )
      session.endSession()

      // Assert
      expect(findSpy).toHaveBeenCalledWith(
        MOCK_PENDING_SUBMISSION_ID,
        null,
        expect.anything(),
      )
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('validateAttachments', () => {
    it('should reject email mode submissions when attachments are more than 7MB', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: Buffer.alloc(3000001),
      })
      const processedResponse2 = generateNewAttachmentResponse({
        content: Buffer.alloc(4000000),
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])
      const response2 = omit(processedResponse2, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await SubmissionService.validateAttachments(
        [response1, response2],
        FormResponseMode.Email,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new AttachmentTooLargeError())
    })

    it('should accept storage mode submissions when attachments are more than 7MB', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: Buffer.alloc(7000001),
        filename: 'moreThan7MB.jpg',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await SubmissionService.validateAttachments(
        [response1],
        FormResponseMode.Encrypt,
      )
      expect(result._unsafeUnwrap()).toBeTrue()
    })

    it('should reject storage mode submissions when attachments are more than 20MB', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: Buffer.alloc(10000001),
      })
      const processedResponse2 = generateNewAttachmentResponse({
        content: Buffer.alloc(10000000),
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])
      const response2 = omit(processedResponse2, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await SubmissionService.validateAttachments(
        [response1, response2],
        FormResponseMode.Encrypt,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new AttachmentTooLargeError())
    })

    it('should reject submissions when file types are invalid', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync('./__tests__/unit/backend/resources/invalid.py'),
        filename: 'invalid.py',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await SubmissionService.validateAttachments(
        [response1],
        FormResponseMode.Email,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new InvalidFileExtensionError())
    })

    it('should reject submissions when there are invalid file types in zip', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync(
          './__tests__/unit/backend/resources/nestedInvalid.zip',
        ),
        filename: 'nestedInvalid.zip',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await SubmissionService.validateAttachments(
        [response1],
        FormResponseMode.Email,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new InvalidFileExtensionError())
    })

    it('should accept submissions when file types are valid', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync('./__tests__/unit/backend/resources/govtech.jpg'),
        filename: 'govtech.jpg',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await SubmissionService.validateAttachments(
        [response1],
        FormResponseMode.Email,
      )
      expect(result._unsafeUnwrap()).toEqual(true)
    })

    it('should accept submissions when file types in zip are valid', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync(
          './__tests__/unit/backend/resources/nestedValid.zip',
        ),
        filename: 'nestedValid.zip',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await SubmissionService.validateAttachments(
        [response1],
        FormResponseMode.Email,
      )
      expect(result._unsafeUnwrap()).toEqual(true)
    })
  })
})

/**
 * Helper function to create a transform stream that converts Buffers to strings.
 */
const stringify = () =>
  new Transform({
    objectMode: true,
    transform: function (chunk, _encoding, callback) {
      return callback(null, JSON.stringify(chunk, null, 4) + '\n')
    },
  })
