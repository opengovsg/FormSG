import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import MailService from 'src/app/services/mail/mail.service'
import { IFormIssueSchema, IPopulatedForm } from 'src/types'

import getFormIssueModel from '../../../models/form_issue.server.model'
import { DatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as IssueService from '../issue.service'
import { notifyFormAdmin } from '../issue.service'

const MOCK_FORM_ID = new ObjectId()
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
  })

  describe('getIsFirstIssueForFormToday', () => {
    let FORM_ISSUE: IFormIssueSchema
    const MOCK_ISSUE_ID = ObjectId.createFromTime(
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
        _id: ObjectId.createFromTime(yesterday.valueOf()),
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
        _id: ObjectId.createFromTime(earlier.getSeconds()),
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
        _id: ObjectId.createFromTime(aSecondAgo.getTime() / 1000),
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
    const MOCK_ISSUE_ID = ObjectId.createFromTime(
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
      const actualResult = await notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).toHaveBeenCalledTimes(1)
      expect(actualResult).toBeFalse()
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
      const actualResult = await notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).toHaveBeenCalledTimes(1)
      expect(actualResult).toBeTrue()
    })

    it('should return false on not sending any mail due to the existence of prior issue complain', async () => {
      // Arrange
      const aSecondAgo = new Date(MOCK_ISSUE_ID.getTimestamp().valueOf() - 1000)
      await FormIssueModel.create({
        issue: 'I just want to complain',
        formId: MOCK_FORM_ID,
        _id: ObjectId.createFromTime(aSecondAgo.getTime() / 1000),
      })
      const mailSpy = jest.spyOn(
        MailService,
        'sendFormIssueReportedNotificationToAdmin',
      )
      const form = {
        admin: { email: MOCK_EMAIL },
      } as IPopulatedForm
      // Act
      const actualResult = await notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).not.toHaveBeenCalled()
      expect(actualResult).toBeFalse()
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
      const actualResult = await notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(mailSpy).not.toHaveBeenCalled()
      expect(actualResult).toBeFalse()
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
      const actualResult = await notifyFormAdmin({
        form: form,
        formIssue: FORM_ISSUE,
      })
      // Assert
      expect(dbSpy).not.toHaveBeenCalled()
      expect(mailSpy).not.toHaveBeenCalled()
      expect(actualResult).toBeFalse()
    })
  })
})
