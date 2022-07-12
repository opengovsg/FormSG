/* eslint-disable typesafe/no-await-without-trycatch */
import MockAxios from 'jest-mock-axios'

import { FeedbackCsvGenerator } from '../../modules/forms/helpers/FeedbackCsvGenerator'
import * as FormFeedbackService from '../FormFeedbackService'

jest.mock('axios', () => MockAxios)
FeedbackCsvGenerator.prototype.addLineFromFeedback = jest.fn()

describe('FormFeedbackService', () => {
  const mockFormId = 'mock-form-id'
  const mockSubmissionId = 'mock-submission-id'

  afterEach(() => jest.clearAllMocks())
  describe('postFeedback', () => {
    const mockFeedback = {
      formId: mockFormId,
      rating: 3,
      comment: 'some comment',
    }

    it('should return the feedback when the POST request succeeds', async () => {
      // Arrange
      MockAxios.post.mockResolvedValueOnce({ data: mockFeedback })

      // Act
      const actual = await FormFeedbackService.postFeedback(
        mockFormId,
        mockSubmissionId,
        mockFeedback,
      )

      // Assert
      expect(MockAxios.post).toHaveBeenCalledWith(
        `${FormFeedbackService.PUBLIC_FORM_ENDPOINT}/${mockFormId}/submissions/${mockSubmissionId}/feedback`,
        mockFeedback,
      )
      expect(actual).toEqual(mockFeedback)
    })

    it('should reject with the provided error message when the POST request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      MockAxios.post.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = FormFeedbackService.postFeedback(
        mockFormId,
        mockSubmissionId,
        mockFeedback,
      )

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `${FormFeedbackService.PUBLIC_FORM_ENDPOINT}/${mockFormId}/submissions/${mockSubmissionId}/feedback`,
        mockFeedback,
      )
    })
  })

  describe('getFeedback', () => {
    const mockFeedback = {
      formId: mockFormId,
      rating: 3,
      comment: 'some comment',
    }

    it('should return the feedback when the GET request succeeds', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: mockFeedback })

      // Act
      const actual = await FormFeedbackService.getFeedback(mockFormId)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${FormFeedbackService.ADMIN_FORM_ENDPOINT}/${mockFormId}/feedback`,
      )
      expect(actual).toEqual(mockFeedback)
    })

    it('should reject with the provided error message when the GET request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = FormFeedbackService.getFeedback(mockFormId)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${FormFeedbackService.ADMIN_FORM_ENDPOINT}/${mockFormId}/feedback`,
      )
    })
  })

  describe('countFeedback', () => {
    it('should return the feedback count when the GET request succeeds', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: 5 })

      // Act
      const actual = await FormFeedbackService.countFeedback(mockFormId)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${FormFeedbackService.ADMIN_FORM_ENDPOINT}/${mockFormId}/feedback/count`,
      )
      expect(actual).toEqual(5)
    })

    it('should reject with the provided error message when the GET request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = FormFeedbackService.countFeedback(mockFormId)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${FormFeedbackService.ADMIN_FORM_ENDPOINT}/${mockFormId}/feedback/count`,
      )
    })
  })

  describe('downloadFeedback', () => {
    const mockFormTitle = 'some title'
    const mockFeedback = {
      formId: mockFormId,
      rating: 3,
      comment: 'some comment',
    }

    it('should call csvGenerator.addLineFromFeedback and csvGenerator.triggerFileDownloadwhen the GET request succeeds', async () => {
      // Arrange
      MockAxios.get
        .mockResolvedValueOnce({ data: 1 })
        .mockResolvedValueOnce({ data: [mockFeedback] })
      FeedbackCsvGenerator.prototype.addLineFromFeedback = jest.fn()
      FeedbackCsvGenerator.prototype.triggerFileDownload = jest.fn()

      // Act
      await FormFeedbackService.downloadFeedback(mockFormId, mockFormTitle)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${FormFeedbackService.ADMIN_FORM_ENDPOINT}/${mockFormId}/feedback/download`,
      )
      expect(
        FeedbackCsvGenerator.prototype.addLineFromFeedback,
      ).toHaveBeenCalled()
      expect(
        FeedbackCsvGenerator.prototype.triggerFileDownload,
      ).toHaveBeenCalled()
    })

    it('should reject with the correct error message when the feedback is too large to download', async () => {
      // Arrange
      const expected = new Error('Error downloading feedback')
      MockAxios.get
        .mockResolvedValueOnce({ data: 100000 })
        .mockResolvedValueOnce({ data: undefined })
      FeedbackCsvGenerator.prototype.addLineFromFeedback = jest.fn()
      FeedbackCsvGenerator.prototype.triggerFileDownload = jest.fn()

      // Act
      const actualPromise = FormFeedbackService.downloadFeedback(
        mockFormId,
        mockFormTitle,
      )

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${FormFeedbackService.ADMIN_FORM_ENDPOINT}/${mockFormId}/feedback/download`,
      )
    })

    it('should reject with the provided error message when the GET request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      MockAxios.get
        .mockResolvedValueOnce({ data: 100000 })
        .mockRejectedValueOnce(expected)
      FeedbackCsvGenerator.prototype.addLineFromFeedback = jest.fn()
      FeedbackCsvGenerator.prototype.triggerFileDownload = jest.fn()

      // Act
      const actualPromise = FormFeedbackService.downloadFeedback(
        mockFormId,
        mockFormTitle,
      )

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${FormFeedbackService.ADMIN_FORM_ENDPOINT}/${mockFormId}/feedback/download`,
      )
    })
  })
})
