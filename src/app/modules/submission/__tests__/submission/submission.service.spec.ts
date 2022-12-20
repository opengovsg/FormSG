import { ObjectId } from 'bson'
import { times } from 'lodash'
import mongoose from 'mongoose'
import { ok } from 'neverthrow'

import getSubmissionModel from 'src/app/models/submission.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import { InvalidSubmissionIdError } from 'src/app/modules/feedback/feedback.errors'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import MailService from 'src/app/services/mail/mail.service'
import { createQueryWithDateParam } from 'src/app/utils/date'
import {
  IAttachmentInfo,
  IFormDocument,
  IPopulatedForm,
  ISubmissionSchema,
} from 'src/types'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  AutoReplyOptions,
  BasicField,
  SubmissionType,
} from '../../../../../../shared/types'
import { SendEmailConfirmationError } from '../../submission.errors'
import { extractEmailConfirmationData } from '../../submission.utils'

jest.mock('src/app/services/mail/mail.service')
const MockMailService = jest.mocked(MailService)

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
})
