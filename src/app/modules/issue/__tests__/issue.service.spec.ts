import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { compareAsc } from 'date-fns'
import { omit, times } from 'lodash'
import moment from 'moment-timezone'
import mongoose, { Types } from 'mongoose'
import { okAsync } from 'neverthrow'

import MailService from 'src/app/services/mail/mail.service'
import { IFormIssueSchema, IPopulatedForm } from 'src/types'

import { FormIssueMetaDto } from '../../../../../shared/types'
import getFormIssueModel from '../../../models/form_issue.server.model'
import { DatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as IssueService from '../issue.service'

const MOCK_FORM_ID = new Types.ObjectId()
const MOCK_ISSUE =
  'I tried to submit the form, but I keep getting an error message saying that my email address is invalid. I double-checked the email address and it looks correct to me. Can you please help me resolve this issue?'
const MOCK_EMAIL = 'test@example.com'
const FormIssueModel = getFormIssueModel(mongoose)

describe('issue.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => {
    await dbHandler.closeDatabase()
  })

  describe('insertFormIssue', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(FormIssueModel.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return FormNotFoundError when formId is a random string', async () => {
      //Arrange
      const invalidFormId = '1234567890'
      const createSpy = jest.spyOn(FormIssueModel, 'create')

      // Act
      const actualResult = await IssueService.insertFormIssue({
        formId: invalidFormId,
        issue: '',
        email: '',
      })

      // Assert
      expect(createSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toBeTrue()
      await expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        FormNotFoundError,
      )
    })

    it('should return DatabaseError when error occurs whilst inserting formIssue into database', async () => {
      // Mock rejection.
      const createSpy = jest
        .spyOn(FormIssueModel, 'create')
        .mockRejectedValueOnce(new Error('Some error') as never)
      // Act
      const actualResult = await IssueService.insertFormIssue({
        formId: MOCK_FORM_ID.toHexString(),
        issue: MOCK_ISSUE,
        email: MOCK_EMAIL,
      })

      // Assert
      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toBeTrue()
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })

    it('should return IFormIssueSchema on successful insertion into database', async () => {
      // Arrange
      const createSpy = jest.spyOn(FormIssueModel, 'create')
      // Act
      const actualResult = await IssueService.insertFormIssue({
        issue: MOCK_ISSUE,
        formId: MOCK_FORM_ID.toHexString(),
        email: MOCK_EMAIL,
      })
      // Assert
      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap().issue).toEqual(MOCK_ISSUE)
      expect(actualResult._unsafeUnwrap().formId).toEqual(MOCK_FORM_ID)
      expect(actualResult._unsafeUnwrap().email).toEqual(MOCK_EMAIL)
      expect(actualResult._unsafeUnwrap().created).toBeDefined()
      expect(actualResult._unsafeUnwrap().lastModified).toBeDefined()
      expect(actualResult._unsafeUnwrap()._id).toBeDefined()
    })

    it('should return IFormIssueSchema on successful insertion when email is undefined into database', async () => {
      // Arrange
      const createSpy = jest.spyOn(FormIssueModel, 'create')
      // Act
      const actualResult = await IssueService.insertFormIssue({
        issue: MOCK_ISSUE,
        formId: MOCK_FORM_ID.toHexString(),
      })
      // Assert
      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap().issue).toEqual(MOCK_ISSUE)
      expect(actualResult._unsafeUnwrap().formId).toEqual(MOCK_FORM_ID)
      expect(actualResult._unsafeUnwrap().email).toBeUndefined()
      expect(actualResult._unsafeUnwrap().created).toBeDefined()
      expect(actualResult._unsafeUnwrap().lastModified).toBeDefined()
      expect(actualResult._unsafeUnwrap()._id).toBeDefined()
    })
  })

  describe('getIsFirstIssueForFormToday', () => {
    let FORM_ISSUE: IFormIssueSchema
    const MOCK_ISSUE_ID = Types.ObjectId.createFromTime(
      new Date('2023-06-22T23:30:00+08:00').getTime() / 1000,
    )
    beforeEach(async () => {
      await dbHandler.clearCollection(FormIssueModel.collection.name)
      FORM_ISSUE = await FormIssueModel.create({
        _id: MOCK_ISSUE_ID,
        issue: MOCK_ISSUE,
        formId: MOCK_FORM_ID,
      })
    })
    afterEach(() => jest.clearAllMocks())

    it('should return DatabaseError when error occurs whilst counting document', async () => {
      // Arrange
      // Mock failure
      const countDocumentsSpy = jest
        .spyOn(FormIssueModel, 'countDocuments')
        .mockImplementationOnce(
          () =>
            ({
              limit: jest.fn().mockReturnThis(),
              exec: jest
                .fn()
                .mockRejectedValueOnce(new Error('some error') as never),
            } as unknown as mongoose.Query<any, any>),
        )

      // Act
      const actualResult =
        await IssueService.getIsFirstIssueForFormTodayForTesting({
          formIssue: FORM_ISSUE,
        })

      // Assert
      expect(countDocumentsSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toBeTrue()
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })

    it('should return true as form does not have any issue complain at all', async () => {
      // Arrange
      const countDocumentsSpy = jest.spyOn(FormIssueModel, 'countDocuments')

      // Act
      const actualResult =
        await IssueService.getIsFirstIssueForFormTodayForTesting({
          formIssue: FORM_ISSUE,
        })

      // Assert
      expect(countDocumentsSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeTrue()
    })

    it('should return true as form does not have prior issue complain for the day', async () => {
      // Arrange
      // Add a form issue that was added yesterday (accurate up to seconds)
      const yesterday = new Date(
        MOCK_ISSUE_ID.getTimestamp().valueOf() - 60 * 60 * 24,
      )
      await FormIssueModel.create({
        issue: 'I am unable to make a payment',
        formId: MOCK_FORM_ID,
        _id: Types.ObjectId.createFromTime(yesterday.getSeconds()),
      })
      const countDocumentsSpy = jest.spyOn(FormIssueModel, 'countDocuments')

      // Act
      const actualResult =
        await IssueService.getIsFirstIssueForFormTodayForTesting({
          formIssue: FORM_ISSUE,
        })

      // Assert
      expect(countDocumentsSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeTrue()
    })

    it('should return true as prior issue complain was just inserted <1 sec ago', async () => {
      // Arrange
      // Add a form issue that was added a millisecond ago
      const earlier = new Date(MOCK_ISSUE_ID.getTimestamp().valueOf() - 1)
      await FormIssueModel.create({
        issue: 'I am unable to make a payment',
        formId: MOCK_FORM_ID,
        _id: Types.ObjectId.createFromTime(earlier.getSeconds()),
      })
      const countDocumentsSpy = jest.spyOn(FormIssueModel, 'countDocuments')

      // Act
      const actualResult =
        await IssueService.getIsFirstIssueForFormTodayForTesting({
          formIssue: FORM_ISSUE,
        })

      // Assert
      expect(countDocumentsSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeTrue()
    })

    it('should return false as form has prior issue complain for the day', async () => {
      // Arrange
      // Add a form issue that was added a second ago
      const aSecondAgo = new Date(MOCK_ISSUE_ID.getTimestamp().valueOf() - 1000)
      await FormIssueModel.create({
        issue: 'I am unable to make a payment',
        formId: MOCK_FORM_ID,
        _id: Types.ObjectId.createFromTime(aSecondAgo.getTime() / 1000),
      })
      const countDocumentsSpy = jest.spyOn(FormIssueModel, 'countDocuments')
      // Act
      const actualResult =
        await IssueService.getIsFirstIssueForFormTodayForTesting({
          formIssue: FORM_ISSUE,
        })
      // Assert
      expect(countDocumentsSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeFalse()
    })
  })

  describe('notifyFormAdmin', () => {
    let FORM_ISSUE: IFormIssueSchema
    const MOCK_ISSUE_ID = Types.ObjectId.createFromTime(
      new Date('2023-06-22T12:30:00+08:00').getTime() / 1000,
    )
    beforeEach(async () => {
      await dbHandler.clearCollection(FormIssueModel.collection.name)
      FORM_ISSUE = await FormIssueModel.create({
        _id: MOCK_ISSUE_ID,
        issue: MOCK_ISSUE,
        formId: MOCK_FORM_ID,
      })
    })
    afterEach(() => jest.clearAllMocks())

    it('should return MailSendError on failure to send mail', async () => {
      // Arrange
      // Mock failure
      const mailSpy = jest.spyOn(
        MailService,
        'sendFormIssueReportedNotificationToAdmin',
      )
      const form = {
        admin: { email: 'invalidEmail' },
        permissionList: [],
        _id: MOCK_FORM_ID,
      } as unknown as IPopulatedForm
      // Act
      const actualResult = await IssueService.notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeFalse()
    })

    it('should return true on successful mail sending', async () => {
      // Arrange
      const mailSpy = jest
        .spyOn(MailService, 'sendFormIssueReportedNotificationToAdmin')
        .mockReturnValueOnce(okAsync(true))

      const form = {
        admin: { email: MOCK_EMAIL },
        permissionList: [],
        _id: MOCK_FORM_ID,
      } as unknown as IPopulatedForm
      // Act
      const actualResult = await IssueService.notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeTrue()
    })

    it('should return false on not sending any mail due to the existence of prior issue complain', async () => {
      // Arrange
      const aSecondAgo = new Date(MOCK_ISSUE_ID.getTimestamp().valueOf() - 1000)
      await FormIssueModel.create({
        issue: 'I just want to complain',
        formId: MOCK_FORM_ID,
        _id: Types.ObjectId.createFromTime(aSecondAgo.getTime() / 1000),
      })
      const mailSpy = jest.spyOn(
        MailService,
        'sendFormIssueReportedNotificationToAdmin',
      )
      const form = {
        admin: { email: MOCK_EMAIL },
      } as IPopulatedForm
      // Act
      const actualResult = await IssueService.notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).not.toHaveBeenCalled()
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeFalse()
    })

    it('should return DatabaseError on not sending any mail due to the existence of prior issue complain', async () => {
      // Arrange
      // Mock failure
      jest.spyOn(FormIssueModel, 'countDocuments').mockImplementationOnce(
        () =>
          ({
            limit: jest.fn().mockReturnThis(),
            exec: jest
              .fn()
              .mockRejectedValueOnce(new Error('some error') as never),
          } as unknown as mongoose.Query<any, any>),
      )
      const mailSpy = jest.spyOn(
        MailService,
        'sendFormIssueReportedNotificationToAdmin',
      )
      const form = {
        admin: { email: MOCK_EMAIL },
      } as IPopulatedForm
      // Act
      const actualResult = await IssueService.notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).not.toHaveBeenCalled()
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeFalse()
    })

    it('should return false as form admin email is not found', async () => {
      // Arrange
      // Mock failure
      const dbSpy = jest.spyOn(FormIssueModel, 'countDocuments')
      const mailSpy = jest.spyOn(
        MailService,
        'sendFormIssueReportedNotificationToAdmin',
      )
      const form = {} as IPopulatedForm
      // Act
      const actualResult = await IssueService.notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(dbSpy).not.toHaveBeenCalled()
      expect(mailSpy).not.toHaveBeenCalled()
      expect(actualResult.isOk()).toBeTrue()
      expect(actualResult._unsafeUnwrap()).toBeFalse()
    })
  })

  describe('getFormIssues', () => {
    it('should return correct issues', async () => {
      // Arrange
      const expectedCount = 3
      const mockFormId = new Types.ObjectId().toHexString()
      const expectedPromises = times(expectedCount, (count) =>
        FormIssueModel.create({
          formId: mockFormId,
          issue: `I need help ${count}`,
          email: 'getback2mepls@example.com',
        }),
      )
      // Add another issue with a different form id.
      await FormIssueModel.create({
        formId: new Types.ObjectId(),
        issue: 'I cant see anything',
        email: 'email@example.com',
      })
      const expectedCreatedFbs = await Promise.all(expectedPromises)
      // The returned issue also has an `index` key. However, its value is
      // nondeterministic as issue with identical timestamps can be returned
      // in any order. Hence omit the `index` key when checking for the expected
      // issue.
      const expectedIssueListWithoutIndex = expectedCreatedFbs
        // Issue is returned in date order
        .sort((a, b) => compareAsc(a.created!, b.created!))
        .map((issue) => ({
          timestamp: moment(issue.created).valueOf(),
          issue: issue.issue,
          email: issue.email,
        }))
      // Act
      const actualResult = await IssueService.getFormIssues(mockFormId)
      const actual = actualResult._unsafeUnwrap()
      const actualIssueWithoutIndex = actual.issues.map((f) => omit(f, 'index'))

      // Assert
      expect(actual.count).toBe(expectedCount)
      // Issue may not be returned in same order, so perform unordered check.
      // We cannot simply sort the arrays and expect them to be equal, as the order
      // is non-deterministic if the timestamps are identical.
      expect(actualIssueWithoutIndex).toEqual(
        expect.arrayContaining(expectedIssueListWithoutIndex),
      )
      // Check that there are no extra elements
      expect(actualIssueWithoutIndex.length).toBe(
        expectedIssueListWithoutIndex.length,
      )
      // Check that issue is returned in date order. This works even if there are
      // elements with identical timestamps, as we are purely checking for the timestamp order,
      // without checking any other keys.
      expect(expectedIssueListWithoutIndex.map((f) => f.timestamp)).toEqual(
        actual.issues.map((f) => f.timestamp),
      )
    })

    it('should return issue response with zero count and empty array when no issue is available', async () => {
      // Arrange
      const mockFormId = new Types.ObjectId().toHexString()

      // Act
      const actualResult = await IssueService.getFormIssues(mockFormId)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual({
        count: 0,
        issues: [],
      })
    })

    it('should return issue response with empty string email if email is undefined', async () => {
      // Arrange
      const mockFormId = new Types.ObjectId().toHexString()
      const issueSchema = await FormIssueModel.create({
        formId: mockFormId,
        // Missing comment key value.
        issue: 'I am anonymous',
      })

      // Act
      const actualResult = await IssueService.getFormIssues(mockFormId)

      // Assert
      const expectedResult: FormIssueMetaDto = {
        count: 1,
        issues: [
          {
            index: 1,
            timestamp: moment(issueSchema.created).valueOf(),
            issue: 'I am anonymous',
            // Empty email string
            email: '',
          },
        ],
      }
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const mockFormId = new Types.ObjectId().toHexString()
      const sortSpy = jest.fn().mockReturnThis()
      const findSpy = jest.spyOn(FormIssueModel, 'find').mockImplementationOnce(
        () =>
          ({
            sort: sortSpy,
            exec: () => Promise.reject(new Error('boom')),
          } as unknown as mongoose.Query<any, any>),
      )

      // Act
      const actualResult = await IssueService.getFormIssues(mockFormId)

      // Assert
      expect(findSpy).toHaveBeenCalledWith({
        formId: mockFormId,
      })
      expect(sortSpy).toHaveBeenCalledWith({ _id: 1 })
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('getFormIssueStream', () => {
    it('should return stream successfully', async () => {
      // Arrange
      const mockFormId = 'some form id'
      const mockCursor = 'some cursor' as unknown as mongoose.Cursor<any>
      const streamSpy = jest
        .spyOn(FormIssueModel, 'getIssueCursorByFormId')
        .mockReturnValue(mockCursor)

      // Act
      const actual = IssueService.getFormIssueStream(mockFormId)

      // Assert
      expect(actual).toEqual(mockCursor)
      expect(streamSpy).toHaveBeenCalledWith(mockFormId, [
        'issue',
        'email',
        'created',
      ])
    })
  })
})
