import axios from 'axios'
import { ObjectId } from 'bson'
import crypto from 'crypto'
import dedent from 'dedent'
import { cloneDeep, omit, pick } from 'lodash'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import getMockLogger from 'tests/unit/backend/helpers/jest-logger'
import { mocked } from 'ts-jest/utils'

import { EMAIL_HEADERS, EmailType } from 'src/app/constants/mail'
import getFormModel from 'src/app/models/form.server.model'
import MailService from 'src/app/services/mail.service'
import * as LoggerModule from 'src/config/logger'
import {
  BounceType,
  IFormSchema,
  ISnsNotification,
  IUserSchema,
} from 'src/types'

import { makeBounceNotification, MOCK_SNS_BODY } from './bounce-test-helpers'

jest.mock('axios')
const mockAxios = mocked(axios, true)
jest.mock('src/config/logger')
const MockLoggerModule = mocked(LoggerModule, true)
jest.mock('src/app/services/mail.service')
const MockMailService = mocked(MailService, true)

const mockShortTermLogger = getMockLogger()
const mockLogger = getMockLogger()
MockLoggerModule.createCloudWatchLogger.mockReturnValue(mockShortTermLogger)
MockLoggerModule.createLoggerWithLabel.mockReturnValue(mockLogger)

// Import modules which depend on config last so that mocks get imported correctly
// eslint-disable-next-line import/first
import getBounceModel from 'src/app/modules/bounce/bounce.model'
// eslint-disable-next-line import/first
import {
  deactivateFormFromBounce,
  extractEmailType,
  getUpdatedBounceDoc,
  isValidSnsRequest,
  logCriticalBounce,
  logEmailNotification,
  notifyAdminOfBounce,
} from 'src/app/modules/bounce/bounce.service'

const Form = getFormModel(mongoose)
const Bounce = getBounceModel(mongoose)

const MOCK_EMAIL = 'email@example.com'
const MOCK_EMAIL_2 = 'email2@example.com'
const MOCK_FORM_ID = new ObjectId()
const MOCK_ADMIN_ID = new ObjectId()
const MOCK_SUBMISSION_ID = new ObjectId()

describe('BounceService', () => {
  beforeAll(async () => await dbHandler.connect())

  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  describe('extractEmailType', () => {
    it('should extract the email type correctly', () => {
      const notification = makeBounceNotification({
        emailType: EmailType.AdminResponse,
      })
      expect(extractEmailType(notification)).toBe(EmailType.AdminResponse)
    })
  })

  describe('getUpdatedBounceDoc', () => {
    beforeEach(() => {
      jest.resetAllMocks()
    })

    afterEach(async () => {
      await dbHandler.clearDatabase()
    })

    it('should return null when there is no form ID', async () => {
      const notification = makeBounceNotification()
      const header = notification.mail.headers.find(
        (header) => header.name === EMAIL_HEADERS.formId,
      )
      // Needed for TypeScript not to complain
      if (header) {
        header.value = ''
      }
      const result = await getUpdatedBounceDoc(notification)
      expect(result).toBeNull()
    })

    it('should call updateBounceInfo if the document exists', async () => {
      const bounceDoc = new Bounce({
        formId: String(MOCK_FORM_ID),
      })
      await bounceDoc.save()
      const notification = makeBounceNotification({
        formId: MOCK_FORM_ID,
      })
      const result = await getUpdatedBounceDoc(notification)
      expect(result?.toObject()).toEqual(
        bounceDoc.updateBounceInfo(notification).toObject(),
      )
    })

    it('should call fromSnsNotification if the document does not exist', async () => {
      const mock = jest.spyOn(Bounce, 'fromSnsNotification')
      const notification = makeBounceNotification({
        formId: MOCK_FORM_ID,
      })
      const result = await getUpdatedBounceDoc(notification)
      const actual = pick(result?.toObject(), [
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
      logEmailNotification(notification)
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
      logEmailNotification(notification)
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
      logEmailNotification(notification)
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
      logEmailNotification(notification)
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
      logEmailNotification(notification)
      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockShortTermLogger.info).toHaveBeenCalledWith(notification)
    })
  })

  describe('notifyAdminOfBounce', () => {
    const MOCK_FORM_TITLE = 'FormTitle'
    let testUser: IUserSchema

    beforeAll(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs({
        userId: MOCK_ADMIN_ID,
      })
      testUser = user
    })

    afterAll(async () => {
      await dbHandler.clearDatabase()
    })

    beforeEach(async () => {
      jest.resetAllMocks()
    })

    it('should auto-email when admin is not email recipient', async () => {
      const form = new Form({
        admin: MOCK_ADMIN_ID,
        title: MOCK_FORM_TITLE,
      })
      const testForm = await form.save()
      const bounceDoc = new Bounce({
        formId: testForm._id,
        bounces: [
          { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
        ],
      })
      const emailRecipients = await notifyAdminOfBounce(bounceDoc)
      expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
        emailRecipients: [testUser.email],
        bouncedRecipients: [MOCK_EMAIL],
        bounceType: BounceType.Permanent,
        formTitle: testForm.title,
        formId: testForm._id,
      })
      expect(emailRecipients).toEqual([testUser.email])
    })

    it('should auto-email when any collaborator is not email recipient', async () => {
      const testForm = new Form({
        admin: MOCK_ADMIN_ID,
        title: MOCK_FORM_TITLE,
      })
      const collabEmail = 'collaborator@test.gov.sg'
      testForm.permissionList = [{ email: collabEmail, write: true }]
      await testForm.save()
      const bounceDoc = new Bounce({
        formId: testForm._id,
        bounces: [
          { email: testUser.email, hasBounced: true, bounceType: 'Permanent' },
        ],
      })
      const emailRecipients = await notifyAdminOfBounce(bounceDoc)
      expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
        emailRecipients: [collabEmail],
        bouncedRecipients: [testUser.email],
        bounceType: BounceType.Permanent,
        formTitle: testForm.title,
        formId: testForm._id,
      })
      expect(emailRecipients).toEqual([collabEmail])
    })

    it('should not auto-email when admin is email recipient', async () => {
      const testForm = new Form({
        admin: MOCK_ADMIN_ID,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      const bounceDoc = new Bounce({
        formId: testForm._id,
        bounces: [
          { email: testUser.email, hasBounced: true, bounceType: 'Permanent' },
        ],
      })
      const emailRecipients = await notifyAdminOfBounce(bounceDoc)
      expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      expect(emailRecipients).toEqual([])
    })

    it('should not auto-email when all collabs are email recipients', async () => {
      const testForm = new Form({
        admin: MOCK_ADMIN_ID,
        title: MOCK_FORM_TITLE,
      })
      const collabEmail = 'collaborator@test.gov.sg'
      testForm.permissionList = [{ email: collabEmail, write: false }]
      await testForm.save()
      const bounceDoc = new Bounce({
        formId: testForm._id,
        bounces: [
          { email: testUser.email, hasBounced: true, bounceType: 'Permanent' },
          { email: collabEmail, hasBounced: true, bounceType: 'Permanent' },
        ],
      })
      const emailRecipients = await notifyAdminOfBounce(bounceDoc)
      expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      expect(emailRecipients).toEqual([])
    })

    it('should not auto-email when hasAutoEmailed is true', async () => {
      const testForm = new Form({
        admin: MOCK_ADMIN_ID,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      const bounceDoc = new Bounce({
        formId: testForm._id,
        bounces: [
          { email: testUser.email, hasBounced: true, bounceType: 'Permanent' },
        ],
        hasAutoEmailed: true,
      })
      const emailRecipients = await notifyAdminOfBounce(bounceDoc)
      expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      expect(emailRecipients).toEqual([])
    })
  })

  describe('deactivateFormFromBounce', () => {
    afterAll(() => {
      jest.resetAllMocks()
    })

    it('should call Form.deactivateById', async () => {
      const mock = jest.spyOn(Form, 'deactivateById')
      const bounceDoc = new Bounce({
        formId: MOCK_FORM_ID,
      })
      await deactivateFormFromBounce(bounceDoc)
      expect(mock).toHaveBeenCalledWith(MOCK_FORM_ID)
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
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [MOCK_EMAIL],
      })
      const autoEmailRecipients = [MOCK_EMAIL, MOCK_EMAIL_2]
      logCriticalBounce(bounceDoc, snsInfo, autoEmailRecipients)
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Critical bounce',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: true,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [MOCK_EMAIL, MOCK_EMAIL_2],
          numRecipients: 2,
          numTransient: 2,
          numPermanent: 0,
          autoEmailRecipients,
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
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [MOCK_EMAIL],
      })
      const autoEmailRecipients: string[] = []
      logCriticalBounce(bounceDoc, snsInfo, autoEmailRecipients)
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Critical bounce',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: true,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [MOCK_EMAIL, MOCK_EMAIL_2],
          numRecipients: 2,
          numTransient: 0,
          numPermanent: 2,
          autoEmailRecipients,
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
      })
      const snsInfo = makeBounceNotification({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
        bouncedList: [MOCK_EMAIL],
      })
      const autoEmailRecipients: string[] = []
      logCriticalBounce(bounceDoc, snsInfo, autoEmailRecipients)
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Critical bounce',
        meta: {
          action: 'logCriticalBounce',
          hasAutoEmailed: true,
          formId: String(MOCK_FORM_ID),
          submissionId: String(MOCK_SUBMISSION_ID),
          recipients: [MOCK_EMAIL, MOCK_EMAIL_2],
          numRecipients: 2,
          numTransient: 1,
          numPermanent: 1,
          autoEmailRecipients,
          bounceInfo: snsInfo.bounce,
        },
      })
    })
  })

  describe('isValidSnsRequest', () => {
    const keys = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })

    let body: ISnsNotification

    beforeEach(() => {
      body = cloneDeep(MOCK_SNS_BODY)
      mockAxios.get.mockResolvedValue({
        data: keys.publicKey,
      })
    })

    it('should gracefully reject when input is empty', () => {
      return expect(isValidSnsRequest(undefined!)).resolves.toBe(false)
    })

    it('should reject requests when their structure is invalid', () => {
      const invalidBody = omit(cloneDeep(body), 'Type') as ISnsNotification
      return expect(isValidSnsRequest(invalidBody)).resolves.toBe(false)
    })

    it('should reject requests when their certificate URL is invalid', () => {
      body.SigningCertURL = 'http://www.example.com'
      return expect(isValidSnsRequest(body)).resolves.toBe(false)
    })

    it('should reject requests when their signature version is invalid', () => {
      body.SignatureVersion = 'wrongSignatureVersion'
      return expect(isValidSnsRequest(body)).resolves.toBe(false)
    })

    it('should reject requests when their signature is invalid', () => {
      return expect(isValidSnsRequest(body)).resolves.toBe(false)
    })

    it('should accept when requests are valid', () => {
      const signer = crypto.createSign('RSA-SHA1')
      const baseString =
        dedent`Message
        ${body.Message}
        MessageId
        ${body.MessageId}
        Timestamp
        ${body.Timestamp}
        TopicArn
        ${body.TopicArn}
        Type
        ${body.Type}
        ` + '\n'
      signer.write(baseString)
      body.Signature = signer.sign(keys.privateKey, 'base64')
      return expect(isValidSnsRequest(body)).resolves.toBe(true)
    })
  })
})
