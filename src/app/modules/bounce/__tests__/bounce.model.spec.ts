import { ObjectId } from 'bson'
import { omit, pick } from 'lodash'
import mongoose from 'mongoose'

import getBounceModel from 'src/app/modules/bounce/bounce.model'
import { BounceType } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  extractBounceObject,
  makeBounceNotification,
  makeDeliveryNotification,
} from './bounce-test-helpers'

const Bounce = getBounceModel(mongoose)

const MOCK_EMAIL = 'email@email.com'
const MOCK_EMAIL_2 = 'email2@email.com'

const MOCK_CONTACT_1 = {
  email: MOCK_EMAIL,
  contact: '+6581234567',
}

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
        hasAutoEmailed: false,
        hasAutoSmsed: false,
      })
    })

    it('should save with non-defaults when they are provided', async () => {
      const params = {
        formId: new ObjectId(),
        bounces: [
          { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
        ],
        expireAt: new Date(Date.now()),
        hasAutoEmailed: true,
        hasAutoSmsed: true,
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
      await expect(bounce.save()).rejects.toThrow('Form ID is required')
    })
  })

  describe('methods', () => {
    describe('hasNotified', () => {
      it('should return true if hasAutoEmailed is true', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoEmailed: true,
        })
        expect(bounce.hasNotified()).toBe(true)
      })

      it('should return true if hasAutoSmsed is true', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoSmsed: true,
        })
        expect(bounce.hasNotified()).toBe(true)
      })

      it('should return false if both hasAutoEmailed and hasAutoSmsed are false', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoEmailed: false,
          hasAutoSmsed: false,
        })
        expect(bounce.hasNotified()).toBe(false)
      })
    })

    describe('setNotificationState', () => {
      it('should set hasAutoSmsed from false to true when there are SMS recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoSmsed: false,
        })
        bounce.setNotificationState([], [MOCK_CONTACT_1])
        expect(bounce.hasAutoSmsed).toBe(true)
      })

      it('should keep hasAutoSmsed as true when there are SMS recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoSmsed: true,
        })
        bounce.setNotificationState([], [MOCK_CONTACT_1])
        expect(bounce.hasAutoSmsed).toBe(true)
      })

      it('should keep original hasAutoSmsed as true when there are no SMS recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoSmsed: true,
        })
        bounce.setNotificationState([], [])
        expect(bounce.hasAutoSmsed).toBe(true)
      })

      it('should keep original hasAutoSmsed as false when there are no SMS recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoEmailed: false,
        })
        bounce.setNotificationState([], [])
        expect(bounce.hasAutoEmailed).toBe(false)
      })

      it('should set hasAutoEmailed from false to true when there are email recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoEmailed: false,
        })
        bounce.setNotificationState([MOCK_EMAIL], [])
        expect(bounce.hasAutoEmailed).toBe(true)
      })

      it('should keep hasAutoEmailed as true when there are email recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoEmailed: true,
        })
        bounce.setNotificationState([MOCK_EMAIL], [])
        expect(bounce.hasAutoEmailed).toBe(true)
      })

      it('should keep original hasAutoEmailed as true when there are no email recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoEmailed: true,
        })
        bounce.setNotificationState([], [])
        expect(bounce.hasAutoEmailed).toBe(true)
      })

      it('should keep original hasAutoEmailed as false when there are no email recipients', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [],
          hasAutoEmailed: false,
        })
        bounce.setNotificationState([], [])
        expect(bounce.hasAutoEmailed).toBe(false)
      })
    })

    describe('getEmails', () => {
      it('should return the full email list when hasBounced is false for all', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: false },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
        })
        expect(bounce.getEmails()).toEqual([MOCK_EMAIL, MOCK_EMAIL_2])
      })

      it('should return the full email list when hasBounced is true for all', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
            { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Transient' },
          ],
        })
        expect(bounce.getEmails()).toEqual([MOCK_EMAIL, MOCK_EMAIL_2])
      })

      it('should return the full email list when hasBounced is mixed', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: false },
            { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Transient' },
          ],
        })
        expect(bounce.getEmails()).toEqual([MOCK_EMAIL, MOCK_EMAIL_2])
      })
    })

    describe('areAllPermanentBounces', () => {
      it('should return true when all bounces are permanent', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
            { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
        expect(bounce.areAllPermanentBounces()).toBe(true)
      })

      it('should return false when any bounce is transient', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
            { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
        expect(bounce.areAllPermanentBounces()).toBe(false)
      })

      it('should return false when any hasBounced is false', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
        })
        expect(bounce.areAllPermanentBounces()).toBe(false)
      })
    })

    describe('isCriticalBounce', () => {
      it('should return true when all bounces are permanent', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
        expect(bounce.isCriticalBounce()).toBe(true)
      })

      it('should return true when all bounces are transient', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
          ],
        })
        expect(bounce.isCriticalBounce()).toBe(true)
      })

      it('should return true when there is a mix of bounce types', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
          ],
        })
        expect(bounce.isCriticalBounce()).toBe(true)
      })

      it('should return false when there any hasBounced is false', () => {
        const bounce = new Bounce({
          formId: new ObjectId(),
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
            { email: MOCK_EMAIL, hasBounced: false },
          ],
        })
        expect(bounce.isCriticalBounce()).toBe(false)
      })
    })

    describe('updateBounceInfo', () => {
      it('should update bounce type when bounces repeat', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
        const snsInfo = makeBounceNotification({
          formId,
          recipientList: [MOCK_EMAIL],
          bouncedList: [MOCK_EMAIL],
          bounceType: BounceType.Transient,
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
          ],
        })
      })

      it('should set hasBounced to true when existing email bounces', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeBounceNotification({
          formId,
          recipientList: [MOCK_EMAIL],
          bouncedList: [MOCK_EMAIL],
          bounceType: BounceType.Permanent,
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
      })

      it('should set hasBounced to true when unseen email bounces', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeBounceNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2], // we've never seen 2nd one before
          bouncedList: [MOCK_EMAIL_2],
          bounceType: BounceType.Permanent,
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: false },
            { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
      })

      it('should keep existing bounce info when bouncedRecipients does not contain email', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
          ],
        })
        const snsInfo = makeBounceNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          bouncedList: [MOCK_EMAIL_2],
          bounceType: BounceType.Permanent,
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
            { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
      })

      it('should keep existing delivery info when bouncedRecipients does not contain email', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeBounceNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          bouncedList: [MOCK_EMAIL_2],
          bounceType: BounceType.Permanent,
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: false },
            { email: MOCK_EMAIL_2, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
      })

      it('should set hasBounced to false when bouncedRecipients does not contain unseen email', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeBounceNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          // we've never seen MOCK_EMAIL_2 before, but we have no bounce info about it
          bouncedList: [MOCK_EMAIL],
          bounceType: BounceType.Permanent,
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
        })
      })

      it('should set hasBounced to false when subsequent delivery succeeds', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
          ],
        })
        const snsInfo = makeDeliveryNotification({
          formId,
          recipientList: [MOCK_EMAIL],
          deliveredList: [MOCK_EMAIL],
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
      })

      it('should keep existing info when deliveries repeat', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeDeliveryNotification({
          formId,
          recipientList: [MOCK_EMAIL],
          deliveredList: [MOCK_EMAIL],
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
      })

      it('should set hasBounced to false when unseen email is delivered', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeDeliveryNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          deliveredList: [MOCK_EMAIL_2],
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: false },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
        })
      })

      it('should keep existing bounce info when delivered.recipients does not contain email', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
          ],
        })
        const snsInfo = makeDeliveryNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          deliveredList: [MOCK_EMAIL_2],
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
        })
      })

      it('should keep existing delivery info when delivered.recipients does not contain email', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeDeliveryNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          deliveredList: [MOCK_EMAIL_2],
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: false },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
        })
      })

      it('should set hasBounced to false when delivered.recipients contains unseen email', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeDeliveryNotification({
          formId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          deliveredList: [MOCK_EMAIL_2, MOCK_EMAIL_2],
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: false },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
        })
      })

      it('should filter out outdated email recipients', () => {
        const formId = new ObjectId()
        const bounce = new Bounce({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
        })
        const snsInfo = makeDeliveryNotification({
          formId,
          recipientList: [MOCK_EMAIL_2],
          deliveredList: [MOCK_EMAIL_2],
        })
        const updated = bounce.updateBounceInfo(snsInfo)
        expect(pick(updated.toObject(), ['formId', 'bounces'])).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL_2, hasBounced: false }],
        })
      })
    })
  })

  describe('statics', () => {
    describe('fromSnsNotification', () => {
      it('should create documents correctly when delivery notification is valid', () => {
        const formId = new ObjectId()
        const submissionId = new ObjectId()
        const notification = makeDeliveryNotification({
          formId,
          submissionId,
          recipientList: [MOCK_EMAIL],
          deliveredList: [MOCK_EMAIL],
        })

        const actual = Bounce.fromSnsNotification(notification, String(formId))
        expect(omit(extractBounceObject(actual!), 'expireAt')).toEqual({
          formId,
          bounces: [{ email: MOCK_EMAIL, hasBounced: false }],
          hasAutoEmailed: false,
          hasAutoSmsed: false,
        })
        expect(actual!.expireAt).toBeInstanceOf(Date)
      })

      it('should create documents correctly when transient bounce notification is valid', () => {
        const formId = new ObjectId()
        const submissionId = new ObjectId()
        const notification = makeBounceNotification({
          formId,
          submissionId,
          recipientList: [MOCK_EMAIL],
          bouncedList: [MOCK_EMAIL],
          bounceType: BounceType.Transient,
        })

        const actual = Bounce.fromSnsNotification(notification, String(formId))
        expect(omit(extractBounceObject(actual!), 'expireAt')).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Transient' },
          ],
          hasAutoEmailed: false,
          hasAutoSmsed: false,
        })
        expect(actual!.expireAt).toBeInstanceOf(Date)
      })

      it('should create documents correctly when permanent bounce notification is valid', () => {
        const formId = new ObjectId()
        const submissionId = new ObjectId()
        const notification = makeBounceNotification({
          formId,
          submissionId,
          recipientList: [MOCK_EMAIL],
          bouncedList: [MOCK_EMAIL],
          bounceType: BounceType.Permanent,
        })

        const actual = Bounce.fromSnsNotification(notification, String(formId))
        expect(omit(extractBounceObject(actual!), 'expireAt')).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
          ],
          hasAutoEmailed: false,
          hasAutoSmsed: false,
        })
        expect(actual!.expireAt).toBeInstanceOf(Date)
      })

      it('should create documents correctly when only some recipients have bounced', () => {
        const formId = new ObjectId()
        const submissionId = new ObjectId()
        const notification = makeBounceNotification({
          formId,
          submissionId,
          recipientList: [MOCK_EMAIL, MOCK_EMAIL_2],
          bouncedList: [MOCK_EMAIL],
          bounceType: BounceType.Permanent,
        })

        const actual = Bounce.fromSnsNotification(notification, String(formId))
        expect(omit(extractBounceObject(actual!), 'expireAt')).toEqual({
          formId,
          bounces: [
            { email: MOCK_EMAIL, hasBounced: true, bounceType: 'Permanent' },
            { email: MOCK_EMAIL_2, hasBounced: false },
          ],
          hasAutoEmailed: false,
          hasAutoSmsed: false,
        })
        expect(actual!.expireAt).toBeInstanceOf(Date)
      })
    })
  })
})
