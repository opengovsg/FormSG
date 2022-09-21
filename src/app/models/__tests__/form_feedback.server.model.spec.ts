import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'
import mongoose from 'mongoose'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import { IFormFeedback } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

const FeedbackModel = getFormFeedbackModel(mongoose)

describe('form_feedback.server.model', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    const DEFAULT_PARAMS: IFormFeedback = {
      formId: new ObjectId(),
      submissionId: new ObjectId(),
      rating: 5,
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

    it('should throw validation error when formId param is missing', async () => {
      // Act
      const actualPromise = new FeedbackModel(
        omit(DEFAULT_PARAMS, 'formId'),
      ).save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
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

    it('should throw validation error when submissionId param is missing', async () => {
      // Act
      const actualPromise = new FeedbackModel(
        omit(DEFAULT_PARAMS, 'submissionId'),
      ).save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('Statics', () => {
    describe('getFeedbackCursorByFormId', () => {
      it('should return cursor to feedback', async () => {
        // Arrange
        // Create document
        const mockFormId = new ObjectId()
        const mockSubmissionId = new ObjectId()
        const mockFeedbackDoc = await FeedbackModel.create({
          formId: mockFormId,
          submissionId: mockSubmissionId,
          rating: 5,
          comment: 'feedback comment',
        })

        // Act
        const cursor = FeedbackModel.getFeedbackCursorByFormId(
          mockFormId.toHexString(),
        )
        const actualFeedback = []
        for await (const fb of cursor) {
          actualFeedback.push(fb)
        }

        // Assert
        // Cursor should return a lean object instead of a document.
        expect(actualFeedback).toEqual([mockFeedbackDoc.toObject()])
      })
    })
  })
})
