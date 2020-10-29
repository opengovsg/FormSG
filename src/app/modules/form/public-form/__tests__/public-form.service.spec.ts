import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'

import { FormNotFoundError } from '../../form.errors'
import * as PublicFormService from '../public-form.service'

const FormFeedbackModel = getFormFeedbackModel(mongoose)

describe('public-form.service', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('insertFormFeedback', () => {
    const MOCK_FORM_FEEDBACK = new FormFeedbackModel({
      formId: new ObjectId().toHexString(),
      rating: 5,
      comment: 'Great test',
    })

    it('should return DatabaseError when error occurs whilst inserting feedback', async () => {
      // Arrange
      // Mock failure
      const insertSpy = jest
        .spyOn(FormFeedbackModel, 'create')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await PublicFormService.insertFormFeedback(
        MOCK_FORM_FEEDBACK,
      )

      // Assert
      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })

    it('should return FormNotFoundError when formId is not a valid ObjectId', async () => {
      // Arrange
      const insertSpy = jest.spyOn(FormFeedbackModel, 'create')

      // Act
      const actualResult = await PublicFormService.insertFormFeedback({
        formId: 'not-an-objectId',
        comment: MOCK_FORM_FEEDBACK.comment,
        rating: MOCK_FORM_FEEDBACK.rating,
      })

      // Assert
      expect(insertSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should return FormFeedback document when feedback is inserted successfully', async () => {
      // Arrange
      // Mock success.
      const insertSpy = jest
        .spyOn(FormFeedbackModel, 'create')
        .mockResolvedValueOnce(MOCK_FORM_FEEDBACK)

      // Act
      const actualResult = await PublicFormService.insertFormFeedback(
        MOCK_FORM_FEEDBACK,
      )

      // Assert
      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_FORM_FEEDBACK)
    })
  })
})
