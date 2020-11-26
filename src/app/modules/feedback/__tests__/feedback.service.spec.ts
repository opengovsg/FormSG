import { ObjectId } from 'bson-ext'
import { times } from 'lodash'
import moment from 'moment-timezone'
import mongoose from 'mongoose'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import * as FeedbackService from '../feedback.service'

const FormFeedback = getFormFeedbackModel(mongoose)

describe('feedback.service', () => {
  beforeAll(() => dbHandler.connect())
  afterAll(() => dbHandler.closeDatabase())

  describe('getFormFeedbackCount', () => {
    const countSpy = jest.spyOn(FormFeedback, 'countDocuments')
    beforeEach(async () => {
      await dbHandler.clearCollection(FormFeedback.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return correct feedback counts', async () => {
      // Arrange
      // Insert 3 form feedbacks.
      const validFormId = new ObjectId()
      const expectedFeedbackCount = 3
      const feedbackPromises = times(expectedFeedbackCount, (count) =>
        FormFeedback.create({
          comment: `test feedback ${count}`,
          formId: validFormId,
          rating: 5,
        }),
      )
      await Promise.all(feedbackPromises)

      // Act
      const actualResult = await FeedbackService.getFormFeedbackCount(
        validFormId.toHexString(),
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedFeedbackCount)
      expect(countSpy).toHaveBeenCalledTimes(1)
    })

    it('should return 0 feedback count when form has no feedback', async () => {
      // Arrange
      const formWithNoFeedback = new ObjectId().toHexString()

      // Act
      const actualResult = await FeedbackService.getFormFeedbackCount(
        formWithNoFeedback,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(0)
      expect(countSpy).toHaveBeenCalledTimes(1)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const validFormId = new ObjectId().toHexString()
      countSpy.mockImplementationOnce(
        () =>
          (({
            exec: () => Promise.reject(new Error('boom')),
          } as unknown) as mongoose.Query<any>),
      )

      // Act
      const actualResult = await FeedbackService.getFormFeedbackCount(
        validFormId,
      )

      // Assert
      expect(countSpy).toHaveBeenCalledWith({
        formId: validFormId,
      })
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('getFormFeedbackStream', () => {
    it('should return stream successfully', async () => {
      // Arrange
      const mockFormId = 'some form id'
      const mockCursor = ('some cursor' as unknown) as mongoose.QueryCursor<any>
      const streamSpy = jest
        .spyOn(FormFeedback, 'getFeedbackCursorByFormId')
        .mockReturnValue(mockCursor)

      // Act
      const actual = FeedbackService.getFormFeedbackStream(mockFormId)

      // Assert
      expect(actual).toEqual(mockCursor)
      expect(streamSpy).toHaveBeenCalledWith(mockFormId)
    })
  })

  describe('getFormFeedbacks', () => {
    it('should return feedback response successfully', async () => {
      // Arrange
      const expectedCount = 3
      const mockFormId = new ObjectId().toHexString()
      const feedbackPromises = times(expectedCount, (count) =>
        FormFeedback.create({
          formId: mockFormId,
          comment: `cool form ${count}`,
          rating: 5 - count,
        }),
      )
      const createdFeedbacks = await Promise.all(feedbackPromises)
      const expectedFeedbackList = createdFeedbacks.map((fb, idx) => ({
        index: idx + 1,
        timestamp: moment(fb.created).valueOf(),
        rating: fb.rating,
        comment: fb.comment,
        date: moment(fb.created).tz('Asia/Singapore').format('D MMM YYYY'),
        dateShort: moment(fb.created).tz('Asia/Singapore').format('D MMM'),
      }))

      // Act
      const actualResult = await FeedbackService.getFormFeedbacks(mockFormId)

      // Assert
      const expectedAverage = (
        createdFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) /
        expectedCount
      ).toFixed(2)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual({
        average: expectedAverage,
        count: expectedCount,
        feedback: expectedFeedbackList,
      })
    })

    it('should return feedback response with zero count and empty array when no feedback is available', async () => {
      // Arrange
      const mockFormId = new ObjectId().toHexString()

      // Act
      const actualResult = await FeedbackService.getFormFeedbacks(mockFormId)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual({
        count: 0,
        feedback: [],
      })
    })
  })
})
