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
  })
})
