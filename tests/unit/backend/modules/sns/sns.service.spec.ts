import axios from 'axios'
import { ObjectId } from 'bson'
import crypto from 'crypto'
import dedent from 'dedent'
import { cloneDeep, merge, omit, pick } from 'lodash'
import { mocked } from 'ts-jest/utils'

import {
  IBounceNotification,
  IDeliveryNotification,
  IEmailNotification,
  ISnsNotification,
} from 'src/app/modules/sns/sns.types'
import * as loggerModule from 'src/config/logger'
import { IBounce, IBounceSchema } from 'src/types'

import dbHandler from '../../helpers/db-handler'
import getMockLogger, { resetMockLogger } from '../../helpers/jest-logger'

const Bounce = dbHandler.makeModel('bounce.server.model', 'Bounce')

jest.mock('axios')
const mockAxios = mocked(axios, true)
jest.mock('src/config/logger')
const mockLoggerModule = mocked(loggerModule, true)
const mockLogger = getMockLogger()
mockLoggerModule.createCloudWatchLogger.mockImplementation(() => mockLogger)
mockLoggerModule.createLoggerWithLabel.mockImplementation(() => getMockLogger())

// Import the service last so that mocks get imported correctly
// eslint-disable-next-line import/first
import {
  isValidSnsRequest,
  updateBounces,
} from 'src/app/modules/sns/sns.service'

const MOCK_SNS_BODY: ISnsNotification = {
  Type: 'type',
  MessageId: 'message-id',
  TopicArn: 'topic-arn',
  Message: 'message',
  Timestamp: 'timestamp',
  SignatureVersion: '1',
  Signature: 'signature',
  SigningCertURL: 'https://fakeawsurl.amazonaws.com/cert.pem',
}

describe('isValidSnsRequest', () => {
  let keys, body: ISnsNotification
  beforeAll(() => {
    keys = crypto.generateKeyPairSync('rsa', {
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
  })
  beforeEach(() => {
    body = cloneDeep(MOCK_SNS_BODY)
    mockAxios.get.mockResolvedValue({
      data: keys.publicKey,
    })
  })
  test('should gracefully reject empty input', () => {
    return expect(isValidSnsRequest(undefined)).resolves.toBe(false)
  })
  test('should reject requests without valid structure', () => {
    delete body.Type
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should reject requests with invalid certificate URL', () => {
    body.SigningCertURL = 'http://www.example.com'
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should reject requests with invalid signature version', () => {
    body.SignatureVersion = 'wrongSignatureVersion'
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should reject requests with invalid signature', () => {
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should accept valid requests', () => {
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
  const recipientList = [
    'email1@example.com',
    'email2@example.com',
    'email3@example.com',
  ]
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
    resetMockLogger(mockLogger)
  })
  afterAll(async () => await dbHandler.closeDatabase())

  test('should save a single delivery notification correctly', async () => {
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification = makeDeliveryNotification(
      formId,
      submissionId,
      recipientList,
      recipientList,
    )
    await updateBounces(notification)
    const actualBounceDoc = await Bounce.findOne({ formId })
    const actualBounce = extractExpectedBounce(actualBounceDoc)
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: false,
    }))
    expect(mockLogger.info).toHaveBeenCalledWith(
      JSON.parse(notification.Message),
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should save a single non-critical bounce notification correctly', async () => {
    const bounces = {
      [recipientList[0]]: true,
      [recipientList[1]]: false,
      [recipientList[2]]: false,
    }
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(0, 1), // Only first email bounced
    )
    await updateBounces(notification)
    const actualBounceDoc = await Bounce.findOne({ formId })
    const actualBounce = extractExpectedBounce(actualBounceDoc)
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: bounces[email],
    }))
    expect(mockLogger.info).toHaveBeenCalledWith(
      JSON.parse(notification.Message),
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should save a single critical bounce notification correctly', async () => {
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList,
    )
    await updateBounces(notification)
    const actualBounceDoc = await Bounce.findOne({ formId })
    const actualBounce = extractExpectedBounce(actualBounceDoc)
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: true,
    }))
    expect(mockLogger.info).toHaveBeenCalledWith(
      JSON.parse(notification.Message),
    )
    expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
      type: 'CRITICAL BOUNCE',
    })
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: true,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should save consecutive delivery notifications correctly', async () => {
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification1 = makeDeliveryNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(0, 1), // First email delivered
    )
    const notification2 = makeDeliveryNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(1), // Second two emails delivered
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractExpectedBounce(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: false,
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toEqual(
      JSON.parse(notification1.Message),
    )
    expect(mockLogger.info.mock.calls[1][0]).toEqual(
      JSON.parse(notification2.Message),
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should save consecutive non-critical bounce notifications correctly', async () => {
    const bounces = {
      [recipientList[0]]: true,
      [recipientList[1]]: true,
      [recipientList[2]]: false,
    }
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification1 = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(0, 1), // First email bounced
    )
    const notification2 = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(1, 2), // Second email bounced
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractExpectedBounce(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: bounces[email],
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toEqual(
      JSON.parse(notification1.Message),
    )
    expect(mockLogger.info.mock.calls[1][0]).toEqual(
      JSON.parse(notification2.Message),
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should save consecutive critical bounce notifications correctly', async () => {
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification1 = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(0, 1), // First email bounced
    )
    const notification2 = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(1, 3), // Second and third email bounced
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractExpectedBounce(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: true,
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toEqual(
      JSON.parse(notification1.Message),
    )
    expect(mockLogger.info.mock.calls[1][0]).toEqual(
      JSON.parse(notification2.Message),
    )
    expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
      type: 'CRITICAL BOUNCE',
    })
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: true,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should save delivery, then bounce notifications correctly', async () => {
    const bounces = {
      [recipientList[0]]: false,
      [recipientList[1]]: true,
      [recipientList[2]]: true,
    }
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification1 = makeDeliveryNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(0, 1), // First email delivered
    )
    const notification2 = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(1, 3), // Second and third email bounced
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractExpectedBounce(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: bounces[email],
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toEqual(
      JSON.parse(notification1.Message),
    )
    expect(mockLogger.info.mock.calls[1][0]).toEqual(
      JSON.parse(notification2.Message),
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should save bounce, then delivery notifications correctly', async () => {
    const bounces = {
      [recipientList[0]]: true,
      [recipientList[1]]: false,
      [recipientList[2]]: false,
    }
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification1 = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(0, 1), // First email bounced
    )
    const notification2 = makeDeliveryNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(1, 3), // Second and third email delivered
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractExpectedBounce(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: bounces[email],
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toEqual(
      JSON.parse(notification1.Message),
    )
    expect(mockLogger.info.mock.calls[1][0]).toEqual(
      JSON.parse(notification2.Message),
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should set hasBounced to false on subsequent success', async () => {
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification1 = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList.slice(0, 1), // First email bounced
    )
    const notification2 = makeDeliveryNotification(
      formId,
      submissionId,
      recipientList,
      recipientList, // All emails delivered
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractExpectedBounce(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: false,
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toEqual(
      JSON.parse(notification1.Message),
    )
    expect(mockLogger.info.mock.calls[1][0]).toEqual(
      JSON.parse(notification2.Message),
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  test('should not log critical bounces if hasAlarmed is true', async () => {
    const formId = new ObjectId()
    const submissionId1 = new ObjectId()
    const submissionId2 = new ObjectId()
    const notification1 = makeBounceNotification(
      formId,
      submissionId1,
      recipientList,
      recipientList,
    )
    const notification2 = makeBounceNotification(
      formId,
      submissionId2,
      recipientList,
      recipientList,
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractExpectedBounce(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: true,
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toEqual(
      JSON.parse(notification1.Message),
    )
    expect(mockLogger.info.mock.calls[1][0]).toEqual(
      JSON.parse(notification2.Message),
    )
    // Expect only 1 call to logger.warn
    expect(mockLogger.warn.mock.calls.length).toBe(1)
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: true,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })
})

const makeEmailNotification = (
  notificationType: 'Bounce' | 'Delivery',
  formId: ObjectId,
  submissionId: ObjectId,
  recipientList: string[],
): IEmailNotification => {
  return {
    notificationType,
    mail: {
      source: 'donotreply@form.gov.sg',
      destination: recipientList,
      headers: [
        {
          name: 'X-Formsg-Form-ID',
          value: String(formId),
        },
        {
          name: 'X-Formsg-Submission-ID',
          value: String(submissionId),
        },
        {
          name: 'X-Formsg-Email-Type',
          value: 'Admin (response)',
        },
      ],
      commonHeaders: {
        subject: `Title (Ref: ${submissionId})`,
        to: recipientList,
        from: 'donotreply@form.gov.sg',
      },
    },
  }
}

const makeBounceNotification = (
  formId: ObjectId,
  submissionId: ObjectId,
  recipientList: string[],
  bouncedList: string[],
  bounceType: 'Transient' | 'Permanent' = 'Permanent',
): ISnsNotification => {
  const Message = merge(
    makeEmailNotification('Bounce', formId, submissionId, recipientList),
    {
      bounce: {
        bounceType,
        bouncedRecipients: bouncedList.map((emailAddress) => ({
          emailAddress,
        })),
      },
    },
  ) as IBounceNotification
  const body = cloneDeep(MOCK_SNS_BODY)
  body.Message = JSON.stringify(Message)
  return body
}

const makeDeliveryNotification = (
  formId: ObjectId,
  submissionId: ObjectId,
  recipientList: string[],
  deliveredList: string[],
): ISnsNotification => {
  const Message = merge(
    makeEmailNotification('Delivery', formId, submissionId, recipientList),
    {
      delivery: {
        recipients: deliveredList,
      },
    },
  ) as IDeliveryNotification
  const body = cloneDeep(MOCK_SNS_BODY)
  body.Message = JSON.stringify(Message)
  return body
}

// Omit mongoose values from Bounce document
const extractExpectedBounce = (bounce: IBounceSchema): Omit<IBounce, '_id'> => {
  const extracted = pick(bounce.toObject(), [
    'formId',
    'hasAlarmed',
    'expireAt',
    'bounces',
  ])
  return extracted
}
