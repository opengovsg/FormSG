import { ObjectId } from 'bson'
import { omit, pick } from 'lodash'
import mongoose from 'mongoose'

import getBounceModel from 'src/app/models/bounce.server.model'

import {
  extractBounceObject,
  makeBounceNotification,
  makeDeliveryNotification,
} from '../helpers/bounce'
import dbHandler from '../helpers/jest-db'

const Bounce = getBounceModel(mongoose)

const MOCK_EMAIL = 'email@email.com'

describe('Bounce Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('schema', () => {
    test('should create and save successfully with defaults', async () => {
      const formId = new ObjectId()
      const bounces = [{ email: MOCK_EMAIL }]
      const savedBounce = await new Bounce({ formId, bounces }).save()
      const savedBounceObject = extractBounceObject(savedBounce)
      expect(savedBounce._id).toBeDefined()
      expect(savedBounce.expireAt).toBeInstanceOf(Date)
      expect(omit(savedBounceObject, 'expireAt')).toEqual({
        formId,
        bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        hasAlarmed: false,
      })
    })

    test('should create and save successfully with non-defaults', async () => {
      const params = {
        formId: new ObjectId(),
        bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
        expireAt: new Date(Date.now()),
        hasAlarmed: true,
      }
      const savedBounce = await new Bounce(params).save()
      const savedBounceObject = extractBounceObject(savedBounce)
      expect(savedBounceObject).toEqual(params)
    })

    test('should reject invalid emails', async () => {
      const bounce = new Bounce({
        formId: new ObjectId(),
        bounces: [{ email: 'this is an ex-parrot' }],
      })
      await expect(bounce.save()).rejects.toThrow()
    })

    test('should reject empty form IDs', async () => {
      const bounce = new Bounce()
      await expect(bounce.save()).rejects.toThrowError('Form ID is required')
    })
  })

  describe('methods', () => {
    describe('merge', () => {
      test('should update old bounce with latest bounce info', async () => {
        const formId = new ObjectId()
        const oldBounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const latestBounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
        })
        const snsInfo = JSON.parse(makeBounceNotification().Message)
        oldBounce.merge(latestBounce, snsInfo)
        expect(pick(oldBounce.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
        })
      })

      test('should set hasBounced to false if email is delivered later', async () => {
        const formId = new ObjectId()
        const oldBounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
        })
        const latestBounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const notification = makeDeliveryNotification(
          formId,
          new ObjectId(),
          [MOCK_EMAIL],
          [MOCK_EMAIL],
        )
        const snsInfo = JSON.parse(notification.Message)
        oldBounce.merge(latestBounce, snsInfo)
        expect(pick(oldBounce.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
      })

      test('should update email list as necessary', async () => {
        const newEmail = 'newemail@email.com'
        const formId = new ObjectId()
        const oldBounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
        })
        const latestBounce = new Bounce({
          formId,
          bounces: [{ email: newEmail, hasBounced: false }],
        })
        const notification = makeDeliveryNotification(
          formId,
          new ObjectId(),
          [MOCK_EMAIL],
          [MOCK_EMAIL],
        )
        const snsInfo = JSON.parse(notification.Message)
        oldBounce.merge(latestBounce, snsInfo)
        expect(pick(oldBounce.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [{ email: newEmail, hasBounced: false }],
        })
      })
    })
  })

  describe('statics', () => {
    describe('fromSnsNotification', () => {
      test('should create documents from delivery notifications correctly', async () => {
        const formId = new ObjectId()
        const submissionId = new ObjectId()
        const notification = JSON.parse(
          makeDeliveryNotification(
            formId,
            submissionId,
            [MOCK_EMAIL],
            [MOCK_EMAIL],
          ).Message,
        )
        const actual = Bounce.fromSnsNotification(notification)
        expect(omit(extractBounceObject(actual), 'expireAt')).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
          hasAlarmed: false,
        })
        expect(actual.expireAt).toBeInstanceOf(Date)
      })

      test('should create documents from bounce notifications correctly', async () => {
        const formId = new ObjectId()
        const submissionId = new ObjectId()
        const notification = JSON.parse(
          makeBounceNotification(
            formId,
            submissionId,
            [MOCK_EMAIL],
            [MOCK_EMAIL],
          ).Message,
        )
        const actual = Bounce.fromSnsNotification(notification)
        expect(omit(extractBounceObject(actual), 'expireAt')).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
          hasAlarmed: false,
        })
        expect(actual.expireAt).toBeInstanceOf(Date)
      })
    })
  })
})
