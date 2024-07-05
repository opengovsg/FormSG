/* eslint-disable import/first */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import getMockLogger from '__tests__/unit/backend/helpers/jest-logger'
import { ObjectId } from 'bson'
import { cloneDeep, omit, pick } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import SNSMessageValidator from 'sns-validator'

import * as LoggerModule from 'src/app/config/logger'
import getFormModel from 'src/app/models/form.server.model'
import * as UserService from 'src/app/modules/user/user.service'
import { EMAIL_HEADERS, EmailType } from 'src/app/services/mail/mail.constants'
import MailService from 'src/app/services/mail/mail.service'
import PostmanSmsService from 'src/app/services/postman-sms/postman-sms.service'
import {
  BounceType,
  IPopulatedForm,
  ISnsNotification,
  IUserSchema,
} from 'src/types'

import { DatabaseError } from '../../core/core.errors'
import { UserWithContactNumber } from '../../user/user.types'

import { makeBounceNotification, MOCK_SNS_BODY } from './bounce-test-helpers'

jest.mock('sns-validator')
const MockedSNSMessageValidator = jest.mocked(SNSMessageValidator)

jest.mock('src/app/config/logger')
const MockLoggerModule = jest.mocked(LoggerModule)
jest.mock('src/app/services/mail/mail.service')
const MockMailService = jest.mocked(MailService)
jest.mock('src/app/services/postman-sms/postman-sms.service', () => ({
  PostmanSmsService: {
    sendFormDeactivatedSms: jest.fn(),
    sendBouncedSubmissionSms: jest.fn(),
  },
}))
const MockedPostmanSmsService = jest.mocked(PostmanSmsService)

jest.mock('src/app/modules/user/user.service')
const MockUserService = jest.mocked(UserService)

const mockShortTermLogger = getMockLogger()
const mockLogger = getMockLogger()
MockLoggerModule.createCloudWatchLogger.mockReturnValue(mockShortTermLogger)
MockLoggerModule.createLoggerWithLabel.mockReturnValue(mockLogger)

// Import modules which depend on config last so that mocks get imported correctly
import getBounceModel from 'src/app/modules/bounce/bounce.model'
import * as BounceService from 'src/app/modules/bounce/bounce.service'
import {
  InvalidNumberError,
  SmsSendError,
} from 'src/app/services/postman-sms/postman-sms.errors'

import {
  InvalidNotificationError,
  MissingEmailHeadersError,
} from '../bounce.errors'

const Form = getFormModel(mongoose)
const Bounce = getBounceModel(mongoose)

const MOCK_EMAIL = 'email@example.com'
const MOCK_EMAIL_2 = 'email2@example.com'
const MOCK_CONTACT = {
  email: MOCK_EMAIL,
  contact: '+6581234567',
}
const MOCK_CONTACT_2 = {
  email: MOCK_EMAIL_2,
  contact: '+6581234568',
}
const MOCK_FORM_ID = new ObjectId()
const MOCK_ADMIN_ID = new ObjectId()
const MOCK_SUBMISSION_ID = new ObjectId()

describe('BounceService', () => {
  beforeAll(async () => await dbHandler.connect())

  beforeEach(() => {
    MockMailService.sendBounceNotification.mockReturnValue(okAsync(true))
  })

  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })

  afterAll(async () => await dbHandler.closeDatabase())

  describe('extractEmailType', () => {
    it('should extract the email type correctly', () => {
      const notification = makeBounceNotification({
        emailType: EmailType.AdminResponse,
      })
      expect(BounceService.extractEmailType(notification)).toBe(
        EmailType.AdminResponse,
      )
    })
  })

  describe('getUpdatedBounceDoc', () => {
    beforeEach(() => {
      jest.resetAllMocks()
    })

    afterEach(async () => {
      await dbHandler.clearDatabase()
    })

    it('should return MissingEmailHeadersError when there is no form ID', async () => {
      const notification = makeBounceNotification()
      const header = notification.mail.headers.find(
        (header) => header.name === EMAIL_HEADERS.formId,
      )
      // Needed for TypeScript not to complain
      if (header) {
        header.value = ''
      }
      const result = await BounceService.getUpdatedBounceDoc(notification)
      expect(result._unsafeUnwrapErr()).toEqual(new MissingEmailHeadersError())
    })

    it('should call updateBounceInfo if the document exists', async () => {
      const bounceDoc = new Bounce({
        formId: String(MOCK_FORM_ID),
      })
      await bounceDoc.save()
      const notification = makeBounceNotification({
        formId: MOCK_FORM_ID,
      })
      const result = await BounceService.getUpdatedBounceDoc(notification)
      expect(result._unsafeUnwrap().toObject()).toEqual(
        bounceDoc.updateBounceInfo(notification).toObject(),
      )
    })

    it('should call fromSnsNotification if the document does not exist', async () => {
      const mock = jest.spyOn(Bounce, 'fromSnsNotification')
      const notification = makeBounceNotification({
        formId: MOCK_FORM_ID,
      })
      const result = await BounceService.getUpdatedBounceDoc(notification)
      const actual = pick(result._unsafeUnwrap().toObject(), [
        'formId',
        'bounces',
        'hasAutoEmailed',
      ])
      expect(actual).toEqual({
        formId: MOCK_FORM_ID,
        bounces: [],
        hasAutoEmailed: false,
      })
      expect(mock).toHaveBeenCalledWith(notification, String(MOCK_FORM_ID))
    })
  })

  describe('logEmailNotification', () => {
    const MOCK_RECIPIENT_LIST = [
      'email1@example.com',
      'email2@example.com',
      'email3@example.com',
    ]
    beforeEach(() => jest.resetAllMocks())

    it('should log email confirmations to short-term logs', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeBounceNotification({
        formId,
        submissionId,
        recipientList: MOCK_RECIPIENT_LIST,
        bouncedList: MOCK_RECIPIENT_LIST,
        bounceType: BounceType.Transient,
        emailType: EmailType.EmailConfirmation,
      })
      BounceService.logEmailNotification(notification)
      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockShortTermLogger.info).toHaveBeenCalledWith(notification)
    })

    it('should log admin responses to regular logs', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeBounceNotification({
        formId,
        submissionId,
        recipientList: MOCK_RECIPIENT_LIST,
        bouncedList: MOCK_RECIPIENT_LIST,
        bounceType: BounceType.Transient,
        emailType: EmailType.AdminResponse,
      })
      BounceService.logEmailNotification(notification)
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Email notification',
        meta: {
          action: 'logEmailNotification',
          ...notification,
        },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockShortTermLogger.info).not.toHaveBeenCalled()
    })

    it('should log login OTPs to regular logs', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeBounceNotification({
        formId,
        submissionId,
        recipientList: MOCK_RECIPIENT_LIST,
        bouncedList: MOCK_RECIPIENT_LIST,
        bounceType: BounceType.Transient,
        emailType: EmailType.LoginOtp,
      })
      BounceService.logEmailNotification(notification)
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Email notification',
        meta: {
          action: 'logEmailNotification',
          ...notification,
        },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockShortTermLogger.info).not.toHaveBeenCalled()
    })

    it('should log admin notifications to regular logs', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeBounceNotification({
        formId,
        submissionId,
        recipientList: MOCK_RECIPIENT_LIST,
        bouncedList: MOCK_RECIPIENT_LIST,
        bounceType: BounceType.Transient,
        emailType: EmailType.AdminBounce,
      })
      BounceService.logEmailNotification(notification)
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Email notification',
        meta: {
          action: 'logEmailNotification',
          ...notification,
        },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockShortTermLogger.info).not.toHaveBeenCalled()
    })

    it('should log verification OTPs to short-term logs', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeBounceNotification({
        formId,
        submissionId,
        recipientList: MOCK_RECIPIENT_LIST,
        bouncedList: MOCK_RECIPIENT_LIST,
        bounceType: BounceType.Transient,
        emailType: EmailType.VerificationOtp,
      })
      BounceService.logEmailNotification(notification)
      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockShortTermLogger.info).toHaveBeenCalledWith(notification)
    })
  })

  describe('sendEmailBounceNotification', () => {
    const MOCK_FORM_TITLE = 'FormTitle'
    let testUser: IUserSchema

    beforeEach(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs({
        userId: MOCK_ADMIN_ID,
      })
      testUser = user
    })

    it('should auto-email when admin is not email recipient', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
      }).populate('admin')) as IPopulatedForm
      const bounceDoc = new Bounce({
        formId: form._id,
        bounces: [
          { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
        ],
      })

      const notifiedRecipients =
        await BounceService.sendEmailBounceNotification(bounceDoc, form)

      expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
        emailRecipients: [testUser.email],
        bouncedRecipients: [MOCK_EMAIL],
        bounceType: BounceType.Permanent,
        formTitle: form.title,
        formId: form._id,
      })
      expect(notifiedRecipients._unsafeUnwrap()).toEqual([testUser.email])
    })

    it('should auto-email when any collaborator is not email recipient', async () => {
      const collabEmail = 'collaborator@test.gov.sg'
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
        permissionList: [{ email: collabEmail, write: true }],
      }).populate('admin')) as IPopulatedForm
      const bounceDoc = new Bounce({
        formId: form._id,
        bounces: [
          { email: testUser.email, hasBounced: true, bounceType: 'Permanent' },
        ],
      })

      const notifiedRecipients =
        await BounceService.sendEmailBounceNotification(bounceDoc, form)

      expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
        emailRecipients: [collabEmail],
        bouncedRecipients: [testUser.email],
        bounceType: BounceType.Permanent,
        formTitle: form.title,
        formId: form._id,
      })
      expect(notifiedRecipients._unsafeUnwrap()).toEqual([collabEmail])
    })

    it('should not auto-email when admin is email recipient', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
      }).populate('admin')) as IPopulatedForm
      const bounceDoc = new Bounce({
        formId: form._id,
        bounces: [
          { email: testUser.email, hasBounced: true, bounceType: 'Permanent' },
        ],
      })

      const notifiedRecipients =
        await BounceService.sendEmailBounceNotification(bounceDoc, form)

      expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      expect(notifiedRecipients._unsafeUnwrap()).toEqual([])
    })

    it('should not auto-email when all collabs are email recipients', async () => {
      const collabEmail = 'collaborator@test.gov.sg'
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
        permissionList: [{ email: collabEmail, write: false }],
      }).populate('admin')) as IPopulatedForm
      const bounceDoc = new Bounce({
        formId: form._id,
        bounces: [
          { email: testUser.email, hasBounced: true, bounceType: 'Permanent' },
          { email: collabEmail, hasBounced: true, bounceType: 'Permanent' },
        ],
      })

      const notifiedRecipients =
        await BounceService.sendEmailBounceNotification(bounceDoc, form)

      expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      expect(notifiedRecipients._unsafeUnwrap()).toEqual([])
    })
  })

  describe('sendSmsBounceNotification', () => {
    const MOCK_FORM_TITLE = 'FormTitle'
    let testUser: IUserSchema

    beforeEach(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs({
        userId: MOCK_ADMIN_ID,
      })
      testUser = user
    })

    beforeEach(async () => {
      jest.resetAllMocks()
    })

    it('should send text for all SMS recipients and return successful ones', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
      }).populate('admin')) as IPopulatedForm
      const bounceDoc = new Bounce({
        formId: form._id,
        bounces: [],
      })
      console.log({ MockedPostmanSmsService })
      MockedPostmanSmsService.sendBouncedSubmissionSms.mockReturnValue(
        okAsync(true),
      )

      const notifiedRecipients = await BounceService.sendSmsBounceNotification(
        bounceDoc,
        form,
        [MOCK_CONTACT, MOCK_CONTACT_2],
      )

      expect(
        MockedPostmanSmsService.sendBouncedSubmissionSms,
      ).toHaveBeenCalledTimes(2)
      expect(
        MockedPostmanSmsService.sendBouncedSubmissionSms,
      ).toHaveBeenCalledWith({
        adminEmail: testUser.email,
        adminId: String(testUser._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT.contact,
        recipientEmail: MOCK_CONTACT.email,
      })
      expect(
        MockedPostmanSmsService.sendBouncedSubmissionSms,
      ).toHaveBeenCalledWith({
        adminEmail: testUser.email,
        adminId: String(testUser._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT_2.contact,
        recipientEmail: MOCK_CONTACT_2.email,
      })
      expect(notifiedRecipients._unsafeUnwrap()).toEqual([
        MOCK_CONTACT,
        MOCK_CONTACT_2,
      ])
    })

    it('should return only successfuly SMS recipients when some SMSes fail', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
      }).populate('admin')) as IPopulatedForm
      const bounceDoc = new Bounce({
        formId: form._id,
        bounces: [],
      })
      MockedPostmanSmsService.sendBouncedSubmissionSms
        .mockReturnValueOnce(okAsync(true))
        .mockReturnValueOnce(errAsync(new InvalidNumberError()))

      const notifiedRecipients = await BounceService.sendSmsBounceNotification(
        bounceDoc,
        form,
        [MOCK_CONTACT, MOCK_CONTACT_2],
      )

      expect(
        MockedPostmanSmsService.sendBouncedSubmissionSms,
      ).toHaveBeenCalledTimes(2)
      expect(
        MockedPostmanSmsService.sendBouncedSubmissionSms,
      ).toHaveBeenCalledWith({
        adminEmail: testUser.email,
        adminId: String(testUser._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT.contact,
        recipientEmail: MOCK_CONTACT.email,
      })
      expect(
        MockedPostmanSmsService.sendBouncedSubmissionSms,
      ).toHaveBeenCalledWith({
        adminEmail: testUser.email,
        adminId: String(testUser._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT_2.contact,
        recipientEmail: MOCK_CONTACT_2.email,
      })
      expect(notifiedRecipients._unsafeUnwrap()).toEqual([MOCK_CONTACT])
    })
  })

  describe('logCriticalBounce', () => {
    beforeEach(() => {
      jest.resetAllMocks()
    })

    it('should log correctly when all bounces are transient', () => {
      const bounceDoc = new Bounce({
        formId: MOCK_FORM_ID,
        bounces: [
          { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
          { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Transient' },
        ],
        hasAutoEmailed: true,
        hasAutoSmsed: true,
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [MOCK_EMAIL],
      })
      const autoEmailRecipients = [MOCK_EMAIL, MOCK_EMAIL_2]
      const autoSmsRecipients = [MOCK_CONTACT, MOCK_CONTACT_2]
      BounceService.logCriticalBounce({
        bounceDoc,
        notification: snsInfo,
        autoEmailRecipients,
        autoSmsRecipients,
        hasDeactivated: false,
      })
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Bounced submission',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: true,
          hasAutoSmsed: true,
          hasDeactivated: false,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [MOCK_EMAIL, MOCK_EMAIL_2],
          numRecipients: 2,
          numTransient: 2,
          numPermanent: 0,
          autoEmailRecipients,
          autoSmsRecipients,
          bounceInfo: snsInfo.bounce,
        },
      })
    })

    it('should log correctly when all bounces are permanent', () => {
      const bounceDoc = new Bounce({
        formId: MOCK_FORM_ID,
        bounces: [
          { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
          { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Permanent' },
        ],
        hasAutoEmailed: true,
        hasAutoSmsed: true,
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [MOCK_EMAIL],
      })
      const autoEmailRecipients: string[] = []
      const autoSmsRecipients = [MOCK_CONTACT, MOCK_CONTACT_2]
      BounceService.logCriticalBounce({
        bounceDoc,
        notification: snsInfo,
        autoEmailRecipients,
        autoSmsRecipients,
        hasDeactivated: true,
      })
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Bounced submission',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: true,
          hasAutoSmsed: true,
          hasDeactivated: true,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [MOCK_EMAIL, MOCK_EMAIL_2],
          numRecipients: 2,
          numTransient: 0,
          numPermanent: 2,
          autoEmailRecipients,
          autoSmsRecipients,
          bounceInfo: snsInfo.bounce,
        },
      })
    })

    it('should log correctly when there is a mix of bounceTypes', () => {
      const bounceDoc = new Bounce({
        formId: MOCK_FORM_ID,
        bounces: [
          { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
          { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Transient' },
        ],
        hasAutoEmailed: true,
        hasAutoSmsed: true,
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [MOCK_EMAIL],
      })
      const autoEmailRecipients: string[] = []
      const autoSmsRecipients = [MOCK_CONTACT, MOCK_CONTACT_2]
      BounceService.logCriticalBounce({
        bounceDoc,
        notification: snsInfo,
        autoEmailRecipients,
        autoSmsRecipients,
        hasDeactivated: false,
      })
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Bounced submission',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: true,
          hasAutoSmsed: true,
          hasDeactivated: false,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [MOCK_EMAIL, MOCK_EMAIL_2],
          numRecipients: 2,
          numTransient: 1,
          numPermanent: 1,
          autoEmailRecipients,
          autoSmsRecipients,
          bounceInfo: snsInfo.bounce,
        },
      })
    })

    it('should log correctly when hasAutoEmailed is false', () => {
      const bounceDoc = new Bounce({
        formId: MOCK_FORM_ID,
        bounces: [],
        hasAutoEmailed: false,
        hasAutoSmsed: true,
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [],
      })
      const autoEmailRecipients: string[] = []
      const autoSmsRecipients: UserWithContactNumber[] = []
      BounceService.logCriticalBounce({
        bounceDoc,
        notification: snsInfo,
        autoEmailRecipients,
        autoSmsRecipients,
        hasDeactivated: false,
      })
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Bounced submission',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: false,
          hasAutoSmsed: true,
          hasDeactivated: false,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [],
          numRecipients: 0,
          numTransient: 0,
          numPermanent: 0,
          autoEmailRecipients,
          autoSmsRecipients,
          bounceInfo: snsInfo.bounce,
        },
      })
    })

    it('should log correctly when hasAutoSmsed is false', () => {
      const bounceDoc = new Bounce({
        formId: MOCK_FORM_ID,
        bounces: [],
        hasAutoEmailed: true,
        hasAutoSmsed: false,
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [],
      })
      const autoEmailRecipients: string[] = []
      const autoSmsRecipients: UserWithContactNumber[] = []
      BounceService.logCriticalBounce({
        bounceDoc,
        notification: snsInfo,
        autoEmailRecipients,
        autoSmsRecipients,
        hasDeactivated: false,
      })
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Bounced submission',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: true,
          hasAutoSmsed: false,
          hasDeactivated: false,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [],
          numRecipients: 0,
          numTransient: 0,
          numPermanent: 0,
          autoEmailRecipients,
          autoSmsRecipients,
          bounceInfo: snsInfo.bounce,
        },
      })
    })
  })

  describe('validateSnsRequest', () => {
    // Validation of SNS request is entirely deferred to the npm module sns-validator
    // The tests in this block only check the return values and error types of our thin wrapper

    let body: ISnsNotification

    beforeEach(() => {
      body = cloneDeep(MOCK_SNS_BODY)
    })

    it('should reject invalid notification with an InvalidNotificationError', async () => {
      MockedSNSMessageValidator.mockImplementation(() => {
        return {
          validate: (message, callback) => {
            // we use a timeout to simulate the asynchronous getting of the validation cert
            setTimeout(() => callback(new Error('Some internal SNS Error')), 0)
          },
        }
      })

      const result = await BounceService.validateSnsRequest(body)

      expect(result._unsafeUnwrapErr()).toEqual(new InvalidNotificationError())
    })

    it('should accept when requests are valid', async () => {
      MockedSNSMessageValidator.mockImplementation(() => {
        return {
          validate: (message, callback) => {
            // we use a timeout to simulate the asynchronous getting of the validation cert
            setTimeout(() => callback(null), 0)
          },
        }
      })

      const result = await BounceService.validateSnsRequest(body)

      expect(result._unsafeUnwrap()).toBe(true)
    })
  })

  describe('getEditorsWithContactNumbers', () => {
    const MOCK_FORM_TITLE = 'FormTitle'
    let testUser: IUserSchema

    beforeEach(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs({
        userId: MOCK_ADMIN_ID,
      })
      testUser = user
    })

    beforeEach(async () => {
      jest.resetAllMocks()
    })

    it('should call user service with emails of all write collaborators', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
        permissionList: [
          { email: MOCK_EMAIL, write: true },
          { email: MOCK_EMAIL_2, write: false },
        ],
      }).populate('admin')) as IPopulatedForm
      MockUserService.findContactsForEmails.mockReturnValueOnce(
        okAsync([MOCK_CONTACT]),
      )

      const result = await BounceService.getEditorsWithContactNumbers(form)

      expect(MockUserService.findContactsForEmails).toHaveBeenCalledWith([
        form.admin.email,
        MOCK_EMAIL,
      ])
      expect(result._unsafeUnwrap()).toEqual([MOCK_CONTACT])
    })

    it('should filter out collaborators without contact numbers', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
        permissionList: [
          { email: MOCK_EMAIL, write: true },
          { email: MOCK_EMAIL_2, write: false },
        ],
      }).populate('admin')) as IPopulatedForm
      MockUserService.findContactsForEmails.mockReturnValueOnce(
        okAsync([omit(MOCK_CONTACT, 'contact'), MOCK_CONTACT_2]),
      )

      const result = await BounceService.getEditorsWithContactNumbers(form)

      expect(MockUserService.findContactsForEmails).toHaveBeenCalledWith([
        form.admin.email,
        MOCK_EMAIL,
      ])
      expect(result._unsafeUnwrap()).toEqual([MOCK_CONTACT_2])
    })

    it('should return empty array when UserService returns error', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
        permissionList: [
          { email: MOCK_EMAIL, write: true },
          { email: MOCK_EMAIL_2, write: false },
        ],
      }).populate('admin')) as IPopulatedForm
      MockUserService.findContactsForEmails.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      const result = await BounceService.getEditorsWithContactNumbers(form)

      expect(MockUserService.findContactsForEmails).toHaveBeenCalledWith([
        form.admin.email,
        MOCK_EMAIL,
      ])
      expect(result._unsafeUnwrap()).toEqual([])
    })
  })

  describe('notifyAdminsOfDeactivation', () => {
    const MOCK_FORM_TITLE = 'FormTitle'
    let testUser: IUserSchema

    beforeEach(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs({
        userId: MOCK_ADMIN_ID,
      })
      testUser = user
    })

    beforeEach(async () => {
      jest.resetAllMocks()
    })

    it('should send SMS for all given recipients', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
      }).populate('admin')) as IPopulatedForm
      MockedPostmanSmsService.sendFormDeactivatedSms.mockReturnValue(
        okAsync(true),
      )

      const result = await BounceService.notifyAdminsOfDeactivation(form, [
        MOCK_CONTACT,
        MOCK_CONTACT_2,
      ])

      expect(result._unsafeUnwrap()).toEqual(true)
      expect(
        MockedPostmanSmsService.sendFormDeactivatedSms,
      ).toHaveBeenCalledTimes(2)
      expect(
        MockedPostmanSmsService.sendFormDeactivatedSms,
      ).toHaveBeenCalledWith({
        adminEmail: form.admin.email,
        adminId: String(form.admin._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT.contact,
        recipientEmail: MOCK_CONTACT.email,
      })
      expect(
        MockedPostmanSmsService.sendFormDeactivatedSms,
      ).toHaveBeenCalledWith({
        adminEmail: form.admin.email,
        adminId: String(form.admin._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT_2.contact,
        recipientEmail: MOCK_CONTACT_2.email,
      })
    })

    it('should return true even when some SMSes fail', async () => {
      const form = (await new Form({
        admin: testUser._id,
        title: MOCK_FORM_TITLE,
      }).populate('admin')) as IPopulatedForm
      MockedPostmanSmsService.sendFormDeactivatedSms
        .mockReturnValueOnce(okAsync(true))
        .mockReturnValueOnce(errAsync(new SmsSendError()))

      const result = await BounceService.notifyAdminsOfDeactivation(form, [
        MOCK_CONTACT,
        MOCK_CONTACT_2,
      ])

      expect(result._unsafeUnwrap()).toEqual(true)
      expect(
        MockedPostmanSmsService.sendFormDeactivatedSms,
      ).toHaveBeenCalledTimes(2)
      expect(
        MockedPostmanSmsService.sendFormDeactivatedSms,
      ).toHaveBeenCalledWith({
        adminEmail: form.admin.email,
        adminId: String(form.admin._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT.contact,
        recipientEmail: MOCK_CONTACT.email,
      })
      expect(
        MockedPostmanSmsService.sendFormDeactivatedSms,
      ).toHaveBeenCalledWith({
        adminEmail: form.admin.email,
        adminId: String(form.admin._id),
        formId: form._id,
        formTitle: form.title,
        recipient: MOCK_CONTACT_2.contact,
        recipientEmail: MOCK_CONTACT_2.email,
      })
    })
  })
})
