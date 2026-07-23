/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getAdminFeedbackModel from 'src/app/models/admin_feedback.server.model'

import { DatabaseError } from '../../core/core.errors'
import { MissingAdminFeedbackError } from '../admin-feedback.errors'
import * as AdminFeedbackService from '../admin-feedback.service'

const AdminFeedbackModel = getAdminFeedbackModel(mongoose)

describe('feedback.service', () => {
  beforeAll(() => dbHandler.connect())
  afterAll(() => dbHandler.closeDatabase())

  describe('insertAdminFeedback', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(AdminFeedbackModel.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    const MOCK_USER_ID = new ObjectId().toHexString()
    const MOCK_RATING = 1
    const MOCK_COMMENT = 'mock comment'
    const MOCK_ADMIN_FEEDBACK = new AdminFeedbackModel({
      userId: MOCK_USER_ID,
      csat: MOCK_RATING,
      comment: MOCK_COMMENT,
    })

    it('should return Admin Feedback document on successful insertion with comment', async () => {
      // Arrange
      // Mock success.
      const insertSpy = jest
        .spyOn(AdminFeedbackModel, 'create')
        // @ts-ignore
        .mockResolvedValueOnce(MOCK_ADMIN_FEEDBACK)

      // Act
      const actualResult = await AdminFeedbackService.insertAdminFeedback({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
        comment: MOCK_COMMENT,
      })

      // Assert
      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_ADMIN_FEEDBACK)
    })

    it('should return Admin Feedback document on successful insertion without comment', async () => {
      const mock_feedback_no_comment = new AdminFeedbackModel({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
      })
      // Arrange
      // Mock success.
      const insertSpy = jest
        .spyOn(AdminFeedbackModel, 'create')
        // @ts-ignore
        .mockResolvedValueOnce(mock_feedback_no_comment)

      // Act
      const actualResult = await AdminFeedbackService.insertAdminFeedback({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
      })

      // Assert
      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mock_feedback_no_comment)
    })

    it('should return Admin Feedback document on successful insertion with triggerSource and formId', async () => {
      const mockTriggerSource = 'publish'
      const mockFormId = new ObjectId().toHexString()
      const mockFeedbackWithTrigger = new AdminFeedbackModel({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
        comment: MOCK_COMMENT,
        triggerSource: mockTriggerSource,
        formId: mockFormId,
      })

      const insertSpy = jest
        .spyOn(AdminFeedbackModel, 'create')
        // @ts-ignore
        .mockResolvedValueOnce(mockFeedbackWithTrigger)

      const actualResult = await AdminFeedbackService.insertAdminFeedback({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
        comment: MOCK_COMMENT,
        triggerSource: mockTriggerSource,
        formId: mockFormId,
      })

      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(insertSpy).toHaveBeenCalledWith({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
        comment: MOCK_COMMENT,
        triggerSource: mockTriggerSource,
        formId: mockFormId,
      })
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockFeedbackWithTrigger)
    })

    it('should return DatabaseError when error occurs whilst inserting feedback', async () => {
      // Arrange
      // Mock failure
      const insertSpy = jest
        .spyOn(AdminFeedbackModel, 'create')
        // @ts-ignore
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await AdminFeedbackService.insertAdminFeedback({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
      })

      // Assert
      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('updateAdminFeedback', () => {
    const MOCK_FEEDBACK_ID = new ObjectId().toHexString()
    const MOCK_USER_ID = new ObjectId().toHexString()
    const MOCK_RATING = 1
    const MOCK_COMMENT = 'mock comment'

    beforeEach(async () => {
      await dbHandler.clearCollection(AdminFeedbackModel.collection.name)
      await AdminFeedbackModel.create({
        _id: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
        comment: MOCK_COMMENT,
      })
    })
    afterEach(() => jest.clearAllMocks())

    it('should update feedback successfully with both rating and comment changes', async () => {
      const newRating = 4
      const newComment = 'new comment'

      // Act
      const actualResult = await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
        csat: newRating,
        comment: newComment,
      })

      const newFeedback = await AdminFeedbackModel.findById(MOCK_FEEDBACK_ID)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(newFeedback?.comment).toEqual(newComment)
      expect(newFeedback?.csat).toEqual(newRating)
    })

    it('should set ratingChanged to true when rating is updated', async () => {
      const newRating = 5

      await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
        csat: newRating,
      })

      const newFeedback = await AdminFeedbackModel.findById(MOCK_FEEDBACK_ID)

      expect(newFeedback?.ratingChanged).toEqual(true)
      expect(newFeedback?.csat).toEqual(newRating)
    })

    it('should not set ratingChanged when only comment is updated', async () => {
      await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
        comment: 'just a comment',
      })

      const newFeedback = await AdminFeedbackModel.findById(MOCK_FEEDBACK_ID)

      expect(newFeedback?.ratingChanged).toEqual(false)
    })

    it('should update feedback successfully with only rating change', async () => {
      const newRating = 3
      const expectedResult = new AdminFeedbackModel({
        userId: MOCK_USER_ID,
        csat: newRating,
        comment: MOCK_COMMENT,
      })

      // Act
      const actualResult = await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
        csat: newRating,
      })

      const newFeedback = await AdminFeedbackModel.findById(MOCK_FEEDBACK_ID)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(newFeedback?.comment).toEqual(expectedResult.comment)
      expect(newFeedback?.csat).toEqual(expectedResult.csat)
    })

    it('should update feedback successfully with only comment changes', async () => {
      const newComment = 'new comment'
      const expectedResult = new AdminFeedbackModel({
        userId: MOCK_USER_ID,
        csat: MOCK_RATING,
        comment: newComment,
      })

      // Act
      const actualResult = await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
        comment: newComment,
      })

      const newFeedback = await AdminFeedbackModel.findById(MOCK_FEEDBACK_ID)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(newFeedback?.comment).toEqual(expectedResult.comment)
      expect(newFeedback?.csat).toEqual(expectedResult.csat)
    })

    it('should return ok if there are no changes to be made', async () => {
      // Arrange
      const updateSpy = jest.spyOn(AdminFeedbackModel, 'updateOne')

      // Act
      const actualResult = await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
      })

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(updateSpy).toHaveBeenCalledTimes(0)
    })

    it('should return MissingAdminFeedbackError if feedbackId is invalid', async () => {
      // Act
      const actualResult = await AdminFeedbackService.updateAdminFeedback({
        feedbackId: new ObjectId().toHexString(),
        userId: MOCK_USER_ID,
        comment: 'new comment',
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        MissingAdminFeedbackError,
      )
    })

    it('should return MissingAdminFeedbackError if userId is different', async () => {
      // Act
      const actualResult = await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: new ObjectId().toHexString(),
        comment: 'new comment',
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        MissingAdminFeedbackError,
      )
    })

    it('should return DatabaseError if database error occurs in updateOne', async () => {
      // Arrange
      jest
        .spyOn(AdminFeedbackModel, 'updateOne')
        .mockRejectedValueOnce(new DatabaseError())

      // Act
      const actualResult = await AdminFeedbackService.updateAdminFeedback({
        feedbackId: MOCK_FEEDBACK_ID,
        userId: MOCK_USER_ID,
        comment: 'new comment',
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
})
