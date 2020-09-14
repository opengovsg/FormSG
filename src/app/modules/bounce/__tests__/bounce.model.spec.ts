import { ObjectId } from 'bson'
import { omit, pick } from 'lodash'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getBounceModel from 'src/app/modules/bounce/bounce.model'

import {
  extractBounceObject,
  makeBounceNotification,
  makeDeliveryNotification,
} from './bounce-test-helpers'

const Bounce = getBounceModel(mongoose)

const MOCK_EMAIL = 'email@email.com'

describe('Bounce Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('schema', () => {
    it('should save with defaults when params are not provided', async () => {
      const formId = new ObjectId()
      const bounces = [{ email: MOCK_EMAIL }]
      const savedBounce = await new Bounce({ formId, bounces }).save()
      const savedBounceObject = extractBounceObject(savedBounce)
      expect(savedBounce._id).toBeDefined()
      expect(savedBounce.expireAt).toBeInstanceOf(Date)
      expect(omit(savedBounceObject, 'expireAt')).toEqual({
        formId,
        bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        hasEmailed: false,
      })
    })

    it('should save with non-defaults when they are provided', async () => {
      const params = {
        formId: new ObjectId(),
        bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
        expireAt: new Date(Date.now()),
        hasEmailed: true,
      }
      const savedBounce = await new Bounce(params).save()
      const savedBounceObject = extractBounceObject(savedBounce)
      expect(savedBounceObject).toEqual(params)
    })

    it('should reject emails when they are invalid', async () => {
      const bounce = new Bounce({
        formId: new ObjectId(),
        bounces: [{ email: 'this is an ex-parrot' }],
      })
      await expect(bounce.save()).rejects.toThrow()
    })

    it('should not save when formId is not provided', async () => {
      const bounce = new Bounce()
      await expect(bounce.save()).rejects.toThrowError('Form ID is required')
    })
  })

  describe('methods', () => {
    describe('merge', () => {
      it('should update old bounce when valid bounce info is given', () => {
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

      it('should set hasBounced to false when email is delivered later', () => {
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

      it('should update email list when it changes', () => {
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
      it('should create documents correctly when delivery notification is valid', () => {
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
        expect(omit(extractBounceObject(actual!), 'expireAt')).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
          hasEmailed: false,
        })
        expect(actual!.expireAt).toBeInstanceOf(Date)
      })

      it('should create documents correctly when bounce notification is valid', () => {
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
        expect(omit(extractBounceObject(actual!), 'expireAt')).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: true }],
          hasEmailed: false,
        })
        expect(actual!.expireAt).toBeInstanceOf(Date)
      })
    })
  })
})
