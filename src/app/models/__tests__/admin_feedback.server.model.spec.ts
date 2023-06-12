import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'
import mongoose from 'mongoose'

import { IAdminFeedback } from 'src/types'

import getAdminFeedbackModel from '../admin_feedback.server.model'

const FeedbackModel = getAdminFeedbackModel(mongoose)

describe('form_feedback.server.model', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    const DEFAULT_PARAMS: IAdminFeedback = {
      userId: new ObjectId(),
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
      // Act
      const actualPromise = new FeedbackModel(
        omit(DEFAULT_PARAMS, 'rating'),
      ).save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('Statics', () => {
    describe('updateAdminFeedback', () => {
      it('should update admin feedback correctly', async () => {
        // Create document
        const actualDoc = await FeedbackModel.create({
          userId: new ObjectId(),
          rating: 1,
          comment: 'feedback comment',
        })
        const newRating = 0
        const newComment = 'new comment'

        // Act
        await FeedbackModel.updateAdminFeedback(
          actualDoc.id,
          newComment,
          newRating,
        )

        const updatedFeedback = await FeedbackModel.findById(actualDoc.id)

        // Assert
        expect(updatedFeedback).toBeDefined()
        expect(updatedFeedback?.rating).toEqual(newRating)
        expect(updatedFeedback?.comment).toEqual(newComment)
        expect(updatedFeedback?.id.toString()).toEqual(actualDoc.id.toString())
      })
    })
  })
})
