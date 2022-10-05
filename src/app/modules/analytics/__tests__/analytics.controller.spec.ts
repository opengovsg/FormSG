import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/TaskEither'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseError } from '../../core/core.errors'
import * as AnalyticsController from '../analytics.controller'
import * as AnalyticsService from '../analytics.service'

describe('analytics.controller', () => {
  const MOCK_REQ = expressHandler.mockRequest()
  afterEach(() => jest.clearAllMocks())

  describe('handleGetStatistics', () => {
    it('should return HTTP 200 when calls to AnalyticsService do not return any errors', async () => {
      // Arrange
      const mockUserCount = 10
      const mockFormCount = 20
      const mockSubmissionCount = 100
      const mockAgencyCount = 5

      const mockRes = expressHandler.mockResponse()

      const getUserSpy = jest
        .spyOn(AnalyticsService, 'getUserCount')
        .mockReturnValueOnce(TE.of(mockUserCount))
      const getFormSpy = jest
        .spyOn(AnalyticsService, 'getFormCount')
        .mockReturnValueOnce(TE.of(mockFormCount))
      const getSubmissionSpy = jest
        .spyOn(AnalyticsService, 'getSubmissionCount')
        .mockReturnValueOnce(TE.of(mockSubmissionCount))
      const getAgencySpy = jest
        .spyOn(AnalyticsService, 'getAgencyCount')
        .mockReturnValueOnce(TE.of(mockAgencyCount))

      // Act
      await AnalyticsController.handleGetStatistics(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(getUserSpy).toHaveBeenCalledTimes(1)
      expect(getFormSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getAgencySpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        userCount: mockUserCount,
        formCount: mockFormCount,
        submissionCount: mockSubmissionCount,
        agencyCount: mockAgencyCount,
      })
    })

    it('should return HTTP 500 when calls to AnalyticsService.getUserCount fail', async () => {
      // Arrange
      const mockFormCount = 20
      const mockSubmissionCount = 100
      const mockAgencyCount = 5

      const mockRes = expressHandler.mockResponse()

      const getUserSpy = jest
        .spyOn(AnalyticsService, 'getUserCount')
        .mockReturnValueOnce(TE.fromEither(E.left(new DatabaseError())))
      const getFormSpy = jest
        .spyOn(AnalyticsService, 'getFormCount')
        .mockReturnValueOnce(TE.of(mockFormCount))
      const getSubmissionSpy = jest
        .spyOn(AnalyticsService, 'getSubmissionCount')
        .mockReturnValueOnce(TE.of(mockSubmissionCount))
      const getAgencySpy = jest
        .spyOn(AnalyticsService, 'getAgencyCount')
        .mockReturnValueOnce(TE.of(mockAgencyCount))

      // Act
      await AnalyticsController.handleGetStatistics(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(getUserSpy).toHaveBeenCalledTimes(1)
      expect(getFormSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getAgencySpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        'Unable to retrieve statistics from the database',
      )
    })

    it('should return HTTP 500 when calls to AnalyticsService.getFormCount fails', async () => {
      // Arrange
      const mockUserCount = 10
      const mockSubmissionCount = 100
      const mockAgencyCount = 5

      const mockRes = expressHandler.mockResponse()

      const getUserSpy = jest
        .spyOn(AnalyticsService, 'getUserCount')
        .mockReturnValueOnce(TE.of(mockUserCount))
      const getFormSpy = jest
        .spyOn(AnalyticsService, 'getFormCount')
        .mockReturnValueOnce(TE.fromEither(E.left(new DatabaseError())))
      const getSubmissionSpy = jest
        .spyOn(AnalyticsService, 'getSubmissionCount')
        .mockReturnValueOnce(TE.of(mockSubmissionCount))
      const getAgencySpy = jest
        .spyOn(AnalyticsService, 'getAgencyCount')
        .mockReturnValueOnce(TE.of(mockAgencyCount))

      // Act
      await AnalyticsController.handleGetStatistics(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(getUserSpy).toHaveBeenCalledTimes(1)
      expect(getFormSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getAgencySpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        'Unable to retrieve statistics from the database',
      )
    })

    it('should return HTTP 500 when calls to AnalyticsService.getSubmissionCount fails', async () => {
      // Arrange
      const mockUserCount = 10
      const mockFormCount = 20
      const mockAgencyCount = 5

      const mockRes = expressHandler.mockResponse()

      const getUserSpy = jest
        .spyOn(AnalyticsService, 'getUserCount')
        .mockReturnValueOnce(TE.of(mockUserCount))
      const getFormSpy = jest
        .spyOn(AnalyticsService, 'getFormCount')
        .mockReturnValueOnce(TE.of(mockFormCount))
      const getSubmissionSpy = jest
        .spyOn(AnalyticsService, 'getSubmissionCount')
        .mockReturnValueOnce(TE.fromEither(E.left(new DatabaseError())))
      const getAgencySpy = jest
        .spyOn(AnalyticsService, 'getAgencyCount')
        .mockReturnValueOnce(TE.of(mockAgencyCount))

      // Act
      await AnalyticsController.handleGetStatistics(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(getUserSpy).toHaveBeenCalledTimes(1)
      expect(getFormSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getAgencySpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        'Unable to retrieve statistics from the database',
      )
    })

    it('should return HTTP 500 when calls to AnalyticsService.getAgencyCount fails', async () => {
      // Arrange
      const mockUserCount = 10
      const mockFormCount = 20
      const mockSubmissionCount = 100

      const mockRes = expressHandler.mockResponse()

      const getUserSpy = jest
        .spyOn(AnalyticsService, 'getUserCount')
        .mockReturnValueOnce(TE.of(mockUserCount))
      const getFormSpy = jest
        .spyOn(AnalyticsService, 'getFormCount')
        .mockReturnValueOnce(TE.of(mockFormCount))
      const getAgencySpy = jest
        .spyOn(AnalyticsService, 'getSubmissionCount')
        .mockReturnValueOnce(TE.of(mockSubmissionCount))
      const getSubmissionSpy = jest
        .spyOn(AnalyticsService, 'getAgencyCount')
        .mockReturnValueOnce(TE.fromEither(E.left(new DatabaseError())))

      // Act
      await AnalyticsController.handleGetStatistics(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(getUserSpy).toHaveBeenCalledTimes(1)
      expect(getFormSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getAgencySpy).toHaveBeenCalledTimes(1)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        'Unable to retrieve statistics from the database',
      )
    })
  })
})
