import { ObjectID } from 'bson-ext'
import { times } from 'lodash'
import mongoose from 'mongoose'

import getSubmissionModel from 'src/app/models/submission.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { createQueryWithDateParam } from 'src/app/utils/date'
import * as LogicUtil from 'src/shared/util/logic'
import {
  BasicField,
  IEmailFormSchema,
  IEmailSubmissionSchema,
  IEncryptedFormSchema,
  IEncryptedSubmissionSchema,
  IFormSchema,
  IPreventSubmitLogicSchema,
  LogicType,
  ResponseMode,
  SubmissionType,
} from 'src/types'

import {
  generateDefaultField,
  generateSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  ConflictError,
  ProcessingError,
  ValidateFieldError,
} from '../../submission.errors'

const Submission = getSubmissionModel(mongoose)

describe('submission.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())

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

      // Act
      const actualResult = SubmissionService.getProcessedResponses(
        ({
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField, emailField],
        } as unknown) as IFormSchema,
        [mobileResponse, emailResponse],
      )

      // Assert
      const expectedParsed: ProcessedFieldResponse[] = [
        { ...mobileResponse, isVisible: true },
        { ...emailResponse, isVisible: true },
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

      // Act
      const actualResult = SubmissionService.getProcessedResponses(
        ({
          responseMode: ResponseMode.Email,
          form_fields: [shortTextField, decimalField],
        } as unknown) as IFormSchema,
        [shortTextResponse, decimalResponse],
      )

      // Assert
      const expectedParsed: ProcessedFieldResponse[] = [
        { ...shortTextResponse, isVisible: true },
        { ...decimalResponse, isVisible: true },
      ]

      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedParsed)
    })

    it('should return error when email form has more fields than responses', async () => {
      // Arrange
      const extraField = generateDefaultField(BasicField.Mobile)

      // Act + Assert

      const actualResult = SubmissionService.getProcessedResponses(
        ({
          responseMode: ResponseMode.Email,
          form_fields: [extraField],
        } as unknown) as IEmailFormSchema,
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
        ({
          responseMode: ResponseMode.Encrypt,
          form_fields: [extraField],
        } as unknown) as IEncryptedFormSchema,
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
      mobileResponse.isVisible = false

      const emailResponse = generateSingleAnswerResponse(
        emailField,
        'test@example.com',
      )
      emailResponse.isVisible = false

      // Act
      const actualResult = SubmissionService.getProcessedResponses(
        ({
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField, emailField],
        } as unknown) as IFormSchema,
        [mobileResponse, emailResponse],
      )

      // Assert
      const expectedParsed: ProcessedFieldResponse[] = [
        { ...mobileResponse, isVisible: true }, //getProcessedResponses sets isVisible to be true for encrypt mode
        { ...emailResponse, isVisible: true },
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
        ({
          responseMode: ResponseMode.Encrypt,
          form_fields: [mobileField],
        } as unknown) as IEncryptedFormSchema,
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
        ({
          responseMode: ResponseMode.Email,
          form_fields: [nricField],
        } as unknown) as IEmailFormSchema,
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
        .mockReturnValueOnce(({
          preventSubmitMessage: 'mock prevent submit',
          conditions: [],
          logicType: LogicType.PreventSubmit,
          _id: 'some id',
        } as unknown) as IPreventSubmitLogicSchema)

      // Act + Assert
      const actualResult = SubmissionService.getProcessedResponses(
        ({
          responseMode: ResponseMode.Encrypt,
          form_fields: [],
        } as unknown) as IEncryptedFormSchema,
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
      const mockReturnLogicUnit = ({
        preventSubmitMessage: 'mock prevent submit',
        conditions: [],
        logicType: LogicType.PreventSubmit,
        _id: 'some id',
      } as unknown) as IPreventSubmitLogicSchema

      jest
        .spyOn(LogicUtil, 'getLogicUnitPreventingSubmit')
        .mockReturnValueOnce(mockReturnLogicUnit)

      // Act + Assert
      const actualResult = SubmissionService.getProcessedResponses(
        ({
          responseMode: ResponseMode.Email,
          form_fields: [],
        } as unknown) as IEmailFormSchema,
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
    const MOCK_FORM_ID = new ObjectID()

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
          (({
            exec: () => Promise.reject(new Error('boom')),
          } as unknown) as mongoose.Query<any>),
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
})
