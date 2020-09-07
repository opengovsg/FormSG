import axios from 'axios'
import { ObjectId } from 'bson'
import crypto from 'crypto'
import dedent from 'dedent'
import { cloneDeep, omit } from 'lodash'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import getMockLogger, {
  resetMockLogger,
} from 'tests/unit/backend/helpers/jest-logger'
import { mocked } from 'ts-jest/utils'

import * as LoggerModule from 'src/config/logger'
import { IBounceNotification, ISnsNotification } from 'src/types'

import {
  extractBounceObject,
  makeBounceNotification,
  makeDeliveryNotification,
  MOCK_SNS_BODY,
} from './bounce-helpers'

jest.mock('axios')
const mockAxios = mocked(axios, true)
jest.mock('src/config/logger')
const MockLoggerModule = mocked(LoggerModule, true)
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

const Bounce = getBounceModel(mongoose)

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

  it('should gracefully reject when input is empty', () => {
    return expect(isValidSnsRequest(undefined)).resolves.toBe(false)
  })

  it('should reject requests when their structure is invalid', () => {
    delete body.Type
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
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
  const recipientList = [
    'email1@example.com',
    'email2@example.com',
    'email3@example.com',
  ]

  beforeAll(async () => {
    await dbHandler.connect()
    // Avoid being affected by other modules
    resetMockLogger(mockLogger)
    resetMockLogger(mockShortTermLogger)
  })

  afterEach(async () => {
    await dbHandler.clearDatabase()
    resetMockLogger(mockLogger)
    resetMockLogger(mockShortTermLogger)
  })

  afterAll(async () => await dbHandler.closeDatabase())

  it('should save correctly when there is a single delivery notification', async () => {
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
    const actualBounce = extractBounceObject(actualBounceDoc)
    const expectedBounces = recipientList.map((email) => ({
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
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  it('should save correctly when there is a single non-critical bounce notification', async () => {
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
    const actualBounce = extractBounceObject(actualBounceDoc)
    const expectedBounces = recipientList.map((email) => ({
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
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  it('should save correctly when there is a single critical bounce notification', async () => {
    const formId = new ObjectId()
    const submissionId = new ObjectId()
    const notification = makeBounceNotification(
      formId,
      submissionId,
      recipientList,
      recipientList,
    )
    const parsedNotification: IBounceNotification = JSON.parse(
      notification.Message,
    )
    await updateBounces(notification)
    const actualBounceDoc = await Bounce.findOne({ formId })
    const actualBounce = extractBounceObject(actualBounceDoc)
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: true,
    }))
    expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
      meta: {
        ...parsedNotification,
      },
    })
    expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
      message: 'CRITICAL BOUNCE',
      meta: {
        action: 'Received critical bounce',
        hasAlarmed: false,
        formId: formId.toHexString(),
        submissionId: submissionId.toHexString(),
        bounceInfo: parsedNotification.bounce,
      },
    })
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: true,
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
    const actualBounce = extractBounceObject(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
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
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  it('should save correctly when there are consecutive non-critical bounce notifications', async () => {
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
    const actualBounce = extractBounceObject(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
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
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  it('should save correctly when there are consecutive critical bounce notifications', async () => {
    const formId = new ObjectId()
    const submissionId1 = new ObjectId()
    const submissionId2 = new ObjectId()
    const notification1 = makeBounceNotification(
      formId,
      submissionId1,
      recipientList,
      recipientList.slice(0, 1), // First email bounced
    )
    const parsedNotification1: IBounceNotification = JSON.parse(
      notification1.Message,
    )
    const notification2 = makeBounceNotification(
      formId,
      submissionId2,
      recipientList,
      recipientList.slice(1, 3), // Second and third email bounced
    )
    const parsedNotification2: IBounceNotification = JSON.parse(
      notification2.Message,
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractBounceObject(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: true,
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
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
      message: 'CRITICAL BOUNCE',
      meta: {
        action: 'Received critical bounce',
        hasAlarmed: false,
        formId: formId.toHexString(),
        submissionId: submissionId2.toHexString(),
        bounceInfo: parsedNotification2.bounce,
      },
    })
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: true,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  it('should save correctly when there are delivery then bounce notifications', async () => {
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
    const actualBounce = extractBounceObject(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
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
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  it('should save correctly when there are bounce then delivery notifications', async () => {
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
    const actualBounce = extractBounceObject(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
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
      hasAlarmed: false,
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
    const actualBounce = extractBounceObject(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
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
      hasAlarmed: false,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })

  it('should log a second critical bounce with hasAlarmed true', async () => {
    const formId = new ObjectId()
    const submissionId1 = new ObjectId()
    const submissionId2 = new ObjectId()
    const notification1 = makeBounceNotification(
      formId,
      submissionId1,
      recipientList,
      recipientList,
    )
    const parsedNotification1: IBounceNotification = JSON.parse(
      notification1.Message,
    )
    const notification2 = makeBounceNotification(
      formId,
      submissionId2,
      recipientList,
      recipientList,
    )
    const parsedNotification2: IBounceNotification = JSON.parse(
      notification2.Message,
    )
    await updateBounces(notification1)
    await updateBounces(notification2)
    const actualBounceCursor = await Bounce.find({ formId })
    const actualBounce = extractBounceObject(actualBounceCursor[0])
    const expectedBounces = recipientList.map((email) => ({
      email,
      hasBounced: true,
    }))
    // There should only be one document after 2 notifications
    expect(actualBounceCursor.length).toBe(1)
    expect(mockLogger.info.mock.calls[0][0]).toMatchObject({
      meta: { ...parsedNotification1 },
    })
    expect(mockLogger.info.mock.calls[1][0]).toMatchObject({
      meta: { ...parsedNotification2 },
    })
    expect(mockLogger.warn.mock.calls[0][0]).toMatchObject({
      message: 'CRITICAL BOUNCE',
      meta: {
        action: 'Received critical bounce',
        hasAlarmed: false,
        formId: formId.toHexString(),
        submissionId: submissionId1.toHexString(),
        bounceInfo: parsedNotification1.bounce,
      },
    })
    expect(mockLogger.warn.mock.calls[1][0]).toMatchObject({
      message: 'CRITICAL BOUNCE',
      meta: {
        action: 'Received critical bounce',
        hasAlarmed: true,
        formId: formId.toHexString(),
        submissionId: submissionId2.toHexString(),
        bounceInfo: parsedNotification2.bounce,
      },
    })
    expect(omit(actualBounce, 'expireAt')).toEqual({
      formId,
      hasAlarmed: true,
      bounces: expectedBounces,
    })
    expect(actualBounce.expireAt).toBeInstanceOf(Date)
  })
})
