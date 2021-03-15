import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/TaskEither'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseError } from '../../core/core.errors'
import * as AnalyticsController from '../analytics.controller'
import * as AnalyticsService from '../analytics.service'

describe('analytics.controller', () => {
  const MOCK_REQ = expressHandler.mockRequest()
  afterEach(() => jest.clearAllMocks())

  describe('handleGetUserCount', () => {
    it('should return 200 with number of users on success', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const mockUserCount = 21
      const getUserSpy = jest
        .spyOn(AnalyticsService, 'getUserCount')
        .mockReturnValueOnce(TE.of(mockUserCount))

      // Act
      await AnalyticsController.handleGetUserCount(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(getUserSpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(mockUserCount)
    })

    it('should return 500 when error occurs whilst retrieving user count', async () => {
      const mockRes = expressHandler.mockResponse()
      const getUserSpy = jest
        .spyOn(AnalyticsService, 'getUserCount')
        .mockReturnValueOnce(TE.fromEither(E.left(new DatabaseError())))

      // Act
      await AnalyticsController.handleGetUserCount(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(getUserSpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        'Unable to retrieve number of users from the database',
      )
    })
  })

  describe('handleGetSubmissionCount', () => {
    it('should return 200 with number of submissions on success', async () => {
      // Arrange
      const mockSubmissionCount = 1234
      const mockRes = expressHandler.mockResponse()
      const getSubsSpy = jest
        .spyOn(AnalyticsService, 'getSubmissionCount')
        .mockReturnValueOnce(TE.of(mockSubmissionCount))

      // Act
      await AnalyticsController.handleGetSubmissionCount(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(getSubsSpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(mockSubmissionCount)
    })

    it('should return 500 when error occurs whilst retrieving submission count', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const getSubsSpy = jest
        .spyOn(AnalyticsService, 'getSubmissionCount')
        .mockReturnValueOnce(TE.fromEither(E.left(new DatabaseError())))

      // Act
      await AnalyticsController.handleGetSubmissionCount(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(getSubsSpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        'Unable to retrieve number of submissions from the database',
      )
    })
  })

  describe('handleGetFormCount', () => {
    it('should return 200 with number of forms on success', async () => {
      // Arrange
      const mockFormCount = 99543
      const mockRes = expressHandler.mockResponse()
      const getFormSpy = jest
        .spyOn(AnalyticsService, 'getFormCount')
        .mockReturnValueOnce(TE.of(mockFormCount))

      // Act
      await AnalyticsController.handleGetFormCount(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(getFormSpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(mockFormCount)
    })

    it('should return 500 when error occurs whilst retrieving form count', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const getFormSpy = jest
        .spyOn(AnalyticsService, 'getFormCount')
        .mockReturnValueOnce(TE.fromEither(E.left(new DatabaseError())))

      // Act
      await AnalyticsController.handleGetFormCount(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(getFormSpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        'Unable to retrieve number of forms from the database',
      )
    })
  })
})
