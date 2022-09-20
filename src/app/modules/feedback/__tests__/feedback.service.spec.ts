import { ObjectId } from 'bson-ext'
import { compareAsc } from 'date-fns'
import { omit, times } from 'lodash'
import moment from 'moment-timezone'
import mongoose from 'mongoose'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormFeedbackMetaDto } from '../../../../../shared/types'
import { DatabaseError } from '../../core/core.errors'
import { DuplicateFeedbackSubmissionError } from '../feedback.errors'
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
      const validSubmissionId = new ObjectId().toHexString()
      const expectedFeedbackCount = 3
      const feedbackPromises = times(expectedFeedbackCount, (count) =>
        FormFeedback.create({
          comment: `test feedback ${count}`,
          formId: validFormId,
          submissionId: validSubmissionId,
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
          ({
            exec: () => Promise.reject(new Error('boom')),
          } as unknown as mongoose.Query<any, any>),
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
      const mockCursor = 'some cursor' as unknown as mongoose.QueryCursor<any>
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
    const MOCK_SUBMISSION_ID = new ObjectId().toHexString()

    it('should return correct feedback responses', async () => {
      // Arrange
      const expectedCount = 3
      const mockFormId = new ObjectId().toHexString()
      const expectedFbPromises = times(expectedCount, (count) =>
        FormFeedback.create({
          formId: mockFormId,
          submissionId: MOCK_SUBMISSION_ID,
          comment: `cool form ${count}`,
          rating: 5 - count,
        }),
      )
      // Add another feedback with a different form id.
      await FormFeedback.create({
        formId: new ObjectId(),
        submissionId: MOCK_SUBMISSION_ID,
        comment: 'boo this form sux',
        rating: 1,
      })
      const expectedCreatedFbs = await Promise.all(expectedFbPromises)
      // The returned feedback also has an `index` key. However, its value is
      // nondeterministic as feedback with identical timestamps can be returned
      // in any order. Hence omit the `index` key when checking for the expected
      // feedback.
      const expectedFeedbackListWithoutIndex = expectedCreatedFbs
        // Feedback is returned in date order
        .sort((a, b) => compareAsc(a.created!, b.created!))
        .map((fb) => ({
          timestamp: moment(fb.created).valueOf(),
          rating: fb.rating,
          comment: fb.comment,
          date: moment(fb.created).tz('Asia/Singapore').format('D MMM YYYY'),
          dateShort: moment(fb.created).tz('Asia/Singapore').format('D MMM'),
        }))
      // Act
      const actualResult = await FeedbackService.getFormFeedbacks(mockFormId)
      const actual = actualResult._unsafeUnwrap()
      const actualFeedbackWithoutIndex = actual.feedback.map((f) =>
        omit(f, 'index'),
      )

      // Assert
      // Should only average from the feedbacks for given formId.
      const expectedAverage = (
        expectedCreatedFbs.reduce((acc, curr) => acc + curr.rating, 0) /
        expectedCount
      ).toFixed(2)
      expect(actual.average).toBe(expectedAverage)
      expect(actual.count).toBe(expectedCount)
      // Feedback may not be returned in same order, so perform unordered check.
      // We cannot simply sort the arrays and expect them to be equal, as the order
      // is non-deterministic if the timestamps are identical.
      expect(actualFeedbackWithoutIndex).toEqual(
        expect.arrayContaining(expectedFeedbackListWithoutIndex),
      )
      // Check that there are no extra elements
      expect(actualFeedbackWithoutIndex.length).toBe(
        expectedFeedbackListWithoutIndex.length,
      )
      // Check that feedback is returned in date order. This works even if there are
      // elements with identical timestamps, as we are purely checking for the timestamp order,
      // without checking any other keys.
      expect(expectedFeedbackListWithoutIndex.map((f) => f.timestamp)).toEqual(
        actual.feedback.map((f) => f.timestamp),
      )
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

    it('should return feedback response with empty string comment if feedback comment is undefined', async () => {
      // Arrange
      const mockFormId = new ObjectId().toHexString()
      const createdFb = await FormFeedback.create({
        formId: mockFormId,
        submissionId: MOCK_SUBMISSION_ID,
        // Missing comment key value.
        rating: 3,
      })

      // Act
      const actualResult = await FeedbackService.getFormFeedbacks(mockFormId)

      // Assert
      const expectedResult: FormFeedbackMetaDto = {
        count: 1,
        average: '3.00',
        feedback: [
          {
            index: 1,
            timestamp: moment(createdFb.created).valueOf(),
            rating: createdFb.rating,
            // Empty comment string
            comment: '',
            date: moment(createdFb.created)
              .tz('Asia/Singapore')
              .format('D MMM YYYY'),
            dateShort: moment(createdFb.created)
              .tz('Asia/Singapore')
              .format('D MMM'),
          },
        ],
      }
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const mockFormId = new ObjectId().toHexString()
      const sortSpy = jest.fn().mockReturnThis()
      const findSpy = jest.spyOn(FormFeedback, 'find').mockImplementationOnce(
        () =>
          ({
            sort: sortSpy,
            exec: () => Promise.reject(new Error('boom')),
          } as unknown as mongoose.Query<any, any>),
      )

      // Act
      const actualResult = await FeedbackService.getFormFeedbacks(mockFormId)

      // Assert
      expect(findSpy).toHaveBeenCalledWith({
        formId: mockFormId,
      })
      expect(sortSpy).toHaveBeenCalledWith({ created: 1 })
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('hasNoPreviousFeedback', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_SUBMISSION_ID = new ObjectId().toHexString()

    beforeEach(async () => {
      await dbHandler.clearCollection(FormFeedback.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return DuplicateFeedbackSubmissionError when feedback already exists for given submissionId', async () => {
      await FormFeedback.create({
        comment: `test feedback`,
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        rating: 5,
      })

      const actualResult = await FeedbackService.hasNoPreviousFeedback(
        MOCK_SUBMISSION_ID,
      )

      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DuplicateFeedbackSubmissionError,
      )
    })

    it('should return true if there is no existing feedback for given submissionId', async () => {
      await FormFeedback.create({
        comment: `test feedback`,
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        rating: 5,
      })

      const actualResult = await FeedbackService.hasNoPreviousFeedback(
        new ObjectId().toHexString(),
      )

      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      const existSpy = jest.spyOn(FormFeedback, 'exists')
      existSpy.mockImplementationOnce(() => Promise.reject(new Error('boom')))

      const actualResult = await FeedbackService.hasNoPreviousFeedback(
        MOCK_SUBMISSION_ID,
      )

      expect(existSpy).toHaveBeenCalledWith({
        submissionId: MOCK_SUBMISSION_ID,
      })
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
})
