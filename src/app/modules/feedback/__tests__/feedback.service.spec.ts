import { ObjectId } from 'bson-ext'
import { times } from 'lodash'
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
})
