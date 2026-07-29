import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { omit } from 'lodash'
import mongoose, { Types } from 'mongoose'

import { IAdminFeedback } from 'src/types'

import getAdminFeedbackModel from '../admin_feedback.server.model'

const FeedbackModel = getAdminFeedbackModel(mongoose)

describe('form_feedback.server.model', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    const DEFAULT_PARAMS: IAdminFeedback = {
      userId: new Types.ObjectId(),
      rating: 1,
      comment: 'feedback comment',
    }

    it('should create and save successfully', async () => {
      // Act
      const actual = await FeedbackModel.create(DEFAULT_PARAMS)

      // Assert
      expect(actual).toEqual(
        expect.objectContaining({
          ...DEFAULT_PARAMS,
          created: expect.any(Date),
          lastModified: expect.any(Date),
        }),
      )
    })

    it('should save successfully even when comment param is missing', async () => {
      // Arrange
      const paramsWithoutComment = omit(DEFAULT_PARAMS, 'comment')
      // Act
      const actual = await FeedbackModel.create(paramsWithoutComment)

      // Assert
      expect(actual).toEqual(
        expect.objectContaining({
          ...paramsWithoutComment,
          created: expect.any(Date),
          lastModified: expect.any(Date),
        }),
      )
    })

    it('should save successfully with csat and no rating', async () => {
      // Arrange: new rows carry csat instead of the legacy rating.
      const csatParams = { ...omit(DEFAULT_PARAMS, 'rating'), csat: 4 }
      // Act
      const actual = await FeedbackModel.create(csatParams)

      // Assert
      expect(actual.csat).toEqual(4)
      expect(actual.rating).toBeUndefined()
    })

    it('should save successfully with triggerSource and formId', async () => {
      const paramsWithTrigger = {
        ...DEFAULT_PARAMS,
        triggerSource: 'publish',
        formId: new Types.ObjectId(),
      }
      const actual = await FeedbackModel.create(paramsWithTrigger)

      expect(actual).toEqual(
        expect.objectContaining({
          ...paramsWithTrigger,
          created: expect.any(Date),
          lastModified: expect.any(Date),
        }),
      )
    })

    it('should save successfully without triggerSource and formId (backwards compat)', async () => {
      const actual = await FeedbackModel.create(DEFAULT_PARAMS)

      expect(actual.triggerSource).toBeUndefined()
      expect(actual.formId).toBeUndefined()
    })

    it('should throw validation error for invalid triggerSource enum value', async () => {
      const paramsWithInvalidTrigger = {
        ...DEFAULT_PARAMS,
        triggerSource: 'invalid-source',
      }
      const actualPromise = new FeedbackModel(paramsWithInvalidTrigger).save()

      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should accept all valid triggerSource values', async () => {
      for (const source of ['field-edit', 'publish', 'workflow']) {
        const actual = await FeedbackModel.create({
          ...DEFAULT_PARAMS,
          triggerSource: source,
        })
        expect(actual.triggerSource).toEqual(source)
      }
    })

    it('should accept csat values 1 through 5', async () => {
      const baseParams = omit(DEFAULT_PARAMS, 'rating')
      for (const csat of [1, 2, 3, 4, 5]) {
        const actual = await FeedbackModel.create({
          ...baseParams,
          csat,
        })
        expect(actual.csat).toEqual(csat)
      }
    })

    it('should reject csat value of 0', async () => {
      const actualPromise = new FeedbackModel({
        ...omit(DEFAULT_PARAMS, 'rating'),
        csat: 0,
      }).save()

      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject csat value of 6', async () => {
      const actualPromise = new FeedbackModel({
        ...omit(DEFAULT_PARAMS, 'rating'),
        csat: 6,
      }).save()

      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject a legacy rating above 1 (thumbs is 0/1 only)', async () => {
      const actualPromise = new FeedbackModel({
        ...DEFAULT_PARAMS,
        rating: 2,
      }).save()

      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should accept legacy rating values 0 and 1', async () => {
      for (const rating of [0, 1]) {
        const actual = await FeedbackModel.create({
          ...DEFAULT_PARAMS,
          rating,
        })
        expect(actual.rating).toEqual(rating)
      }
    })

    it('should default ratingChanged to false', async () => {
      const actual = await FeedbackModel.create(DEFAULT_PARAMS)
      expect(actual.ratingChanged).toEqual(false)
    })

    it('should save with ratingChanged set to true', async () => {
      const actual = await FeedbackModel.create({
        ...DEFAULT_PARAMS,
        ratingChanged: true,
      })
      expect(actual.ratingChanged).toEqual(true)
    })
  })
})
