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

    it('should throw validation error when rating param is missing', async () => {
      // Arrange
      const paramsWithoutRating = omit(DEFAULT_PARAMS, 'rating')
      // Act
      const actualPromise = new FeedbackModel(paramsWithoutRating).save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
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

    it('should accept rating values 1 through 5', async () => {
      for (const rating of [1, 2, 3, 4, 5]) {
        const actual = await FeedbackModel.create({
          ...DEFAULT_PARAMS,
          rating,
        })
        expect(actual.rating).toEqual(rating)
      }
    })

    it('should reject rating value of 6', async () => {
      const actualPromise = new FeedbackModel({
        ...DEFAULT_PARAMS,
        rating: 6,
      }).save()

      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should still accept rating value of 0 (backwards compat with old thumbs-down records)', async () => {
      const actual = await FeedbackModel.create({
        ...DEFAULT_PARAMS,
        rating: 0,
      })
      expect(actual.rating).toEqual(0)
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
