import axios from 'axios'
import { ObjectId } from 'bson'
import crypto from 'crypto'
import dedent from 'dedent'
import { cloneDeep, omit } from 'lodash'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import getMockLogger from 'tests/unit/backend/helpers/jest-logger'
import { mocked } from 'ts-jest/utils'

import getFormModel from 'src/app/models/form.server.model'
import MailService from 'src/app/services/mail.service'
import * as LoggerModule from 'src/config/logger'
import {
  BounceType,
  IBounceNotification,
  IFormSchema,
  ISnsNotification,
  IUserSchema,
} from 'src/types'

import {
  extractBounceObject,
  makeBounceNotification,
  makeDeliveryNotification,
  MOCK_SNS_BODY,
} from './bounce-test-helpers'

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
  isValidSnsRequest,
  updateBounces,
} from 'src/app/modules/bounce/bounce.service'

const Form = getFormModel(mongoose)
const Bounce = getBounceModel(mongoose)

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

describe('updateBounces', () => {
  const MOCK_RECIPIENT_LIST = [
    'email1@example.com',
    'email2@example.com',
    'email3@example.com',
  ]

  beforeAll(async () => await dbHandler.connect())

  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  describe('Non-critical bounces', () => {
    beforeEach(() => {
      jest.resetAllMocks()
    })

    it('should save correctly when there is a single delivery notification', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeDeliveryNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST,
      )
      await updateBounces(notification)
      const actualBounceDoc = await Bounce.findOne({ formId })
      const actualBounce = extractBounceObject(actualBounceDoc!)
      const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
        email,
        hasBounced: false,
      }))
      expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
        meta: {
          ...JSON.parse(notification.Message),
        },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(omit(actualBounce, 'expireAt')).toEqual({
        formId,
        hasEmailed: false,
        bounces: expectedBounces,
      })
      expect(actualBounce.expireAt).toBeInstanceOf(Date)
    })

    it('should save correctly when there is a single non-critical bounce notification', async () => {
      const bounces = {
        [MOCK_RECIPIENT_LIST[0]]: true,
        [MOCK_RECIPIENT_LIST[1]]: false,
        [MOCK_RECIPIENT_LIST[2]]: false,
      }
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeBounceNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(0, 1), // Only first email bounced
      )
      await updateBounces(notification)
      const actualBounceDoc = await Bounce.findOne({ formId })
      const actualBounce = extractBounceObject(actualBounceDoc!)
      const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
        email,
        hasBounced: bounces[email],
      }))
      expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
        meta: {
          ...JSON.parse(notification.Message),
        },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(omit(actualBounce, 'expireAt')).toEqual({
        formId,
        hasEmailed: false,
        bounces: expectedBounces,
      })
      expect(actualBounce.expireAt).toBeInstanceOf(Date)
    })

    it('should save correctly when there are consecutive delivery notifications', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification1 = makeDeliveryNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(0, 1), // First email delivered
      )
      const notification2 = makeDeliveryNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(1), // Second two emails delivered
      )
      await updateBounces(notification1)
      await updateBounces(notification2)
      const actualBounceCursor = await Bounce.find({ formId })
      const actualBounce = extractBounceObject(actualBounceCursor[0])
      const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
        email,
        hasBounced: false,
      }))
      // There should only be one document after 2 notifications
      expect(actualBounceCursor.length).toBe(1)
      expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
        meta: {
          ...JSON.parse(notification1.Message),
        },
      })
      expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
        meta: {
          ...JSON.parse(notification2.Message),
        },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(omit(actualBounce, 'expireAt')).toEqual({
        formId,
        hasEmailed: false,
        bounces: expectedBounces,
      })
      expect(actualBounce.expireAt).toBeInstanceOf(Date)
    })

    it('should save correctly when there are consecutive non-critical bounce notifications', async () => {
      const bounces = {
        [MOCK_RECIPIENT_LIST[0]]: true,
        [MOCK_RECIPIENT_LIST[1]]: true,
        [MOCK_RECIPIENT_LIST[2]]: false,
      }
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification1 = makeBounceNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(0, 1), // First email bounced
      )
      const notification2 = makeBounceNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(1, 2), // Second email bounced
      )
      await updateBounces(notification1)
      await updateBounces(notification2)
      const actualBounceCursor = await Bounce.find({ formId })
      const actualBounce = extractBounceObject(actualBounceCursor[0])
      const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
        email,
        hasBounced: bounces[email],
      }))
      // There should only be one document after 2 notifications
      expect(actualBounceCursor.length).toBe(1)
      expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
        meta: {
          ...JSON.parse(notification1.Message),
        },
      })
      expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
        meta: {
          ...JSON.parse(notification2.Message),
        },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(omit(actualBounce, 'expireAt')).toEqual({
        formId,
        hasEmailed: false,
        bounces: expectedBounces,
      })
      expect(actualBounce.expireAt).toBeInstanceOf(Date)
    })

    it('should save correctly when there are delivery then bounce notifications', async () => {
      const bounces = {
        [MOCK_RECIPIENT_LIST[0]]: false,
        [MOCK_RECIPIENT_LIST[1]]: true,
        [MOCK_RECIPIENT_LIST[2]]: true,
      }
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification1 = makeDeliveryNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(0, 1), // First email delivered
      )
      const notification2 = makeBounceNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(1, 3), // Second and third email bounced
      )
      await updateBounces(notification1)
      await updateBounces(notification2)
      const actualBounceCursor = await Bounce.find({ formId })
      const actualBounce = extractBounceObject(actualBounceCursor[0])
      const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
        email,
        hasBounced: bounces[email],
      }))
      // There should only be one document after 2 notifications
      expect(actualBounceCursor.length).toBe(1)
      expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
        meta: { ...JSON.parse(notification1.Message) },
      })
      expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
        meta: { ...JSON.parse(notification2.Message) },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(omit(actualBounce, 'expireAt')).toEqual({
        formId,
        hasEmailed: false,
        bounces: expectedBounces,
      })
      expect(actualBounce.expireAt).toBeInstanceOf(Date)
    })

    it('should save correctly when there are bounce then delivery notifications', async () => {
      const bounces = {
        [MOCK_RECIPIENT_LIST[0]]: true,
        [MOCK_RECIPIENT_LIST[1]]: false,
        [MOCK_RECIPIENT_LIST[2]]: false,
      }
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification1 = makeBounceNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(0, 1), // First email bounced
      )
      const notification2 = makeDeliveryNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(1, 3), // Second and third email delivered
      )
      await updateBounces(notification1)
      await updateBounces(notification2)
      const actualBounceCursor = await Bounce.find({ formId })
      const actualBounce = extractBounceObject(actualBounceCursor[0])
      const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
        email,
        hasBounced: bounces[email],
      }))
      // There should only be one document after 2 notifications
      expect(actualBounceCursor.length).toBe(1)
      expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
        meta: { ...JSON.parse(notification1.Message) },
      })
      expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
        meta: { ...JSON.parse(notification2.Message) },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(omit(actualBounce, 'expireAt')).toEqual({
        formId,
        hasEmailed: false,
        bounces: expectedBounces,
      })
      expect(actualBounce.expireAt).toBeInstanceOf(Date)
    })

    it('should set hasBounced to false when a subsequent response is delivered', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification1 = makeBounceNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST.slice(0, 1), // First email bounced
      )
      const notification2 = makeDeliveryNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST, // All emails delivered
      )
      await updateBounces(notification1)
      await updateBounces(notification2)
      const actualBounceCursor = await Bounce.find({ formId })
      const actualBounce = extractBounceObject(actualBounceCursor[0])
      const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
        email,
        hasBounced: false,
      }))
      // There should only be one document after 2 notifications
      expect(actualBounceCursor.length).toBe(1)
      expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
        meta: { ...JSON.parse(notification1.Message) },
      })
      expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
        meta: { ...JSON.parse(notification2.Message) },
      })
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(omit(actualBounce, 'expireAt')).toEqual({
        formId,
        hasEmailed: false,
        bounces: expectedBounces,
      })
      expect(actualBounce.expireAt).toBeInstanceOf(Date)
    })

    it('should log email confirmations to short-term logs', async () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const notification = makeBounceNotification(
        formId,
        submissionId,
        MOCK_RECIPIENT_LIST,
        MOCK_RECIPIENT_LIST,
        BounceType.Transient,
        'Email confirmation',
      )
      await updateBounces(notification)
      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockShortTermLogger.info).toHaveBeenCalledWith(
        JSON.parse(notification.Message),
      )
    })
  })

  describe('Critical bounces', () => {
    const MOCK_FORM_TITLE = 'FormTitle'

    let testForm: IFormSchema
    let testUser: IUserSchema
    beforeAll(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs()
      testUser = user
    })

    describe('Permanent', () => {
      beforeEach(async () => {
        jest.resetAllMocks()
        const form = new Form({
          admin: testUser._id,
          title: MOCK_FORM_TITLE,
        })
        testForm = await form.save()
      })

      it('should log and auto-email if admin is not email recipient', async () => {
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          MOCK_RECIPIENT_LIST,
          MOCK_RECIPIENT_LIST,
          BounceType.Permanent,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
          email,
          hasBounced: true,
        }))

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: true,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
          emailRecipients: [testUser.email],
          bouncedRecipients: MOCK_RECIPIENT_LIST,
          bounceType: BounceType.Permanent,
          formTitle: testForm.title,
          formId: testForm._id,
          submissionId: String(submissionId),
        })
      })

      it('should log and auto-email if any collaborator is not email recipient', async () => {
        const collabEmail = 'collaborator@test.gov.sg'
        testForm.permissionList = [{ email: collabEmail, write: true }]
        await testForm.save()
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          [testUser.email],
          [testUser.email],
          BounceType.Permanent,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = [{ email: testUser.email, hasBounced: true }]

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: true,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
          emailRecipients: [collabEmail],
          bouncedRecipients: [testUser.email],
          bounceType: BounceType.Permanent,
          formTitle: testForm.title,
          formId: testForm._id,
          submissionId: String(submissionId),
        })
      })

      it('should log but not auto-email if admin is email recipient', async () => {
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          [testUser.email],
          [testUser.email],
          BounceType.Permanent,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = [{ email: testUser.email, hasBounced: true }]

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: false,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: false,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      })

      it('should log but not auto-email if all collabs are recipients', async () => {
        const collabEmail = 'collaborator@test.gov.sg'
        testForm.permissionList = [{ email: collabEmail, write: false }]
        await testForm.save()
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          [testUser.email, collabEmail],
          [testUser.email, collabEmail],
          BounceType.Permanent,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = [testUser.email, collabEmail].map((email) => ({
          email,
          hasBounced: true,
        }))

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: false,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: false,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      })

      it('should log but not email again for consecutive critical bounces', async () => {
        const formId = testForm._id
        const submissionId1 = new ObjectId()
        const submissionId2 = new ObjectId()
        const notification1 = makeBounceNotification(
          formId,
          submissionId1,
          MOCK_RECIPIENT_LIST,
          MOCK_RECIPIENT_LIST,
        )
        const parsedNotification1: IBounceNotification = JSON.parse(
          notification1.Message,
        )
        const notification2 = makeBounceNotification(
          formId,
          submissionId2,
          MOCK_RECIPIENT_LIST,
          MOCK_RECIPIENT_LIST,
        )
        const parsedNotification2: IBounceNotification = JSON.parse(
          notification2.Message,
        )
        await updateBounces(notification1)
        await updateBounces(notification2)
        const actualBounceCursor = await Bounce.find({ formId })
        const actualBounce = extractBounceObject(actualBounceCursor[0])
        const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
          email,
          hasBounced: true,
        }))

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification1,
          },
        })
        expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
          meta: {
            ...parsedNotification2,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId1.toHexString(),
            bounceInfo: parsedNotification1.bounce,
          },
        })
        expect(mockLogger.warn.mock.calls[1][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId2.toHexString(),
            bounceInfo: parsedNotification2.bounce,
          },
        })

        // Expect correct Bounce document
        // There should only be one document after 2 notifications
        expect(actualBounceCursor.length).toBe(1)
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: true,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect correct auto-email calls
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledTimes(1)
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
          emailRecipients: [testUser.email],
          bouncedRecipients: MOCK_RECIPIENT_LIST,
          bounceType: BounceType.Permanent,
          formTitle: testForm.title,
          formId: testForm._id,
          submissionId: String(submissionId1),
        })
      })
    })

    describe('Transient', () => {
      beforeEach(async () => {
        jest.resetAllMocks()
        const form = new Form({
          admin: testUser._id,
          title: MOCK_FORM_TITLE,
        })
        testForm = await form.save()
      })

      it('should log and auto-email if admin is not email recipient', async () => {
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          MOCK_RECIPIENT_LIST,
          MOCK_RECIPIENT_LIST,
          BounceType.Transient,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
          email,
          hasBounced: true,
        }))

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: true,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
          emailRecipients: [testUser.email],
          bouncedRecipients: MOCK_RECIPIENT_LIST,
          bounceType: BounceType.Transient,
          formTitle: testForm.title,
          formId: testForm._id,
          submissionId: String(submissionId),
        })
      })

      it('should log and auto-email if any collaborator is not email recipient', async () => {
        const collabEmail = 'collaborator@test.gov.sg'
        testForm.permissionList = [{ email: collabEmail, write: true }]
        await testForm.save()
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          [testUser.email],
          [testUser.email],
          BounceType.Transient,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = [{ email: testUser.email, hasBounced: true }]

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: true,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
          emailRecipients: [collabEmail],
          bouncedRecipients: [testUser.email],
          bounceType: BounceType.Transient,
          formTitle: testForm.title,
          formId: testForm._id,
          submissionId: String(submissionId),
        })
      })

      it('should log but not auto-email if admin is email recipient', async () => {
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          [testUser.email],
          [testUser.email],
          BounceType.Transient,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = [{ email: testUser.email, hasBounced: true }]

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: false,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: false,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      })

      it('should log but not auto-email if all collabs are recipients', async () => {
        const collabEmail = 'collaborator@test.gov.sg'
        testForm.permissionList = [{ email: collabEmail, write: false }]
        await testForm.save()
        const formId = testForm._id
        const submissionId = new ObjectId()
        const notification = makeBounceNotification(
          formId,
          submissionId,
          [testUser.email, collabEmail],
          [testUser.email, collabEmail],
          BounceType.Transient,
        )
        const parsedNotification: IBounceNotification = JSON.parse(
          notification.Message,
        )

        await updateBounces(notification)

        const actualBounceDoc = await Bounce.findOne({ formId })
        const actualBounce = extractBounceObject(actualBounceDoc!)
        const expectedBounces = [testUser.email, collabEmail].map((email) => ({
          email,
          hasBounced: true,
        }))

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: false,
            formId: formId.toHexString(),
            submissionId: submissionId.toHexString(),
            bounceInfo: parsedNotification.bounce,
          },
        })

        // Expect correct bounce document
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: false,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect auto email
        expect(MockMailService.sendBounceNotification).not.toHaveBeenCalled()
      })

      it('should log but not email again for consecutive critical bounces', async () => {
        const formId = testForm._id
        const submissionId1 = new ObjectId()
        const submissionId2 = new ObjectId()
        const notification1 = makeBounceNotification(
          formId,
          submissionId1,
          MOCK_RECIPIENT_LIST,
          MOCK_RECIPIENT_LIST,
          BounceType.Transient,
        )
        const parsedNotification1: IBounceNotification = JSON.parse(
          notification1.Message,
        )
        const notification2 = makeBounceNotification(
          formId,
          submissionId2,
          MOCK_RECIPIENT_LIST,
          MOCK_RECIPIENT_LIST,
        )
        const parsedNotification2: IBounceNotification = JSON.parse(
          notification2.Message,
        )
        await updateBounces(notification1)
        await updateBounces(notification2)
        const actualBounceCursor = await Bounce.find({ formId })
        const actualBounce = extractBounceObject(actualBounceCursor[0])
        const expectedBounces = MOCK_RECIPIENT_LIST.map((email) => ({
          email,
          hasBounced: true,
        }))

        // Expect correct logs
        expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
          meta: {
            ...parsedNotification1,
          },
        })
        expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
          meta: {
            ...parsedNotification2,
          },
        })
        expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId1.toHexString(),
            bounceInfo: parsedNotification1.bounce,
          },
        })
        expect(mockLogger.warn.mock.calls[1][0]).toMatchObject({
          message: 'Critical bounce',
          meta: {
            action: 'updateBounces',
            hasAutoEmailed: true,
            formId: formId.toHexString(),
            submissionId: submissionId2.toHexString(),
            bounceInfo: parsedNotification2.bounce,
          },
        })

        // Expect correct Bounce document
        // There should only be one document after 2 notifications
        expect(actualBounceCursor.length).toBe(1)
        expect(omit(actualBounce, 'expireAt')).toEqual({
          formId,
          hasEmailed: true,
          bounces: expectedBounces,
        })
        expect(actualBounce.expireAt).toBeInstanceOf(Date)

        // Expect correct auto-email calls
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledTimes(1)
        expect(MockMailService.sendBounceNotification).toHaveBeenCalledWith({
          emailRecipients: [testUser.email],
          bouncedRecipients: MOCK_RECIPIENT_LIST,
          bounceType: BounceType.Transient,
          formTitle: testForm.title,
          formId: testForm._id,
          submissionId: String(submissionId1),
        })
      })
    })
  })
})
