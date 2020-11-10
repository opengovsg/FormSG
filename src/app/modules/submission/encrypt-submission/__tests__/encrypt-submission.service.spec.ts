import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { MalformedParametersError } from 'src/app/modules/core/core.errors'

import { getSubmissionCursor } from '../encrypt-submission.service'

const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('encrypt-submission.service', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('getSubmissionCursor', () => {
    it('should return cursor successfully when date range is not provided', async () => {
      // Arrange
      const mockCursor = (jest.fn() as unknown) as mongoose.QueryCursor<any>
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'getSubmissionCursorByFormId')
        .mockReturnValueOnce(mockCursor)
      const mockFormId = new ObjectId().toHexString()

      // Act
      const actualResult = getSubmissionCursor(mockFormId)

      // Assert
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledWith(mockFormId, {})
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockCursor)
    })

    it('should return cursor successfully when date range is provided', async () => {
      // Arrange
      const mockCursor = (jest.fn() as unknown) as mongoose.QueryCursor<any>
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'getSubmissionCursorByFormId')
        .mockReturnValueOnce(mockCursor)
      const mockFormId = new ObjectId().toHexString()
      const mockDateRange = {
        startDate: '2020-01-01',
        endDate: '2020-10-10',
      }

      // Act
      const actualResult = getSubmissionCursor(mockFormId, mockDateRange)

      // Assert
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledWith(mockFormId, mockDateRange)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockCursor)
    })

    it('should return MalformedParametersError when start date is invalid', async () => {
      // Arrange
      const getSubmissionSpy = jest.spyOn(
        EncryptSubmission,
        'getSubmissionCursorByFormId',
      )

      const mockFormId = new ObjectId().toHexString()
      const invalidDateRange = {
        startDate: 'invalid',
        endDate: '2020-10-10',
      }

      // Act
      const actualResult = getSubmissionCursor(mockFormId, invalidDateRange)

      // Assert
      expect(getSubmissionSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError('Malformed date parameter'),
      )
    })

    it('should return MalformedParametersError when end date is invalid', async () => {
      // Arrange
      const getSubmissionSpy = jest.spyOn(
        EncryptSubmission,
        'getSubmissionCursorByFormId',
      )

      const mockFormId = new ObjectId().toHexString()
      const invalidDateRange = {
        startDate: '2019-12-12',
        endDate: 'not-a-date',
      }

      // Act
      const actualResult = getSubmissionCursor(mockFormId, invalidDateRange)

      // Assert
      expect(getSubmissionSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError('Malformed date parameter'),
      )
    })
  })
})
