import { ObjectId } from 'bson-ext'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { IFormSchema } from '../../../../types'
import { SmsCountsDto } from '../../../../types/api'
import { DatabaseError } from '../../../modules/core/core.errors'
import { FormNotFoundError } from '../../../modules/form/form.errors'
import * as FormService from '../../../modules/form/form.service'
import * as SmsService from '../../../services/sms/sms.service'
import * as SmsController from '../sms.controller'

jest.mock('../../../modules/form/form.service')
const MockFormService = mocked(FormService)

jest.mock('../../../services/sms/sms.service')
const MockSmsService = mocked(SmsService)

describe('sms.controller', () => {
  const mockForm = {
    admin: new ObjectId().toHexString(),
  } as unknown as IFormSchema
  const VERIFICATION_SMS_COUNT = 3

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeAll(() => {
    MockFormService.retrieveFormById.mockReturnValue(okAsync(mockForm))
    MockSmsService.retrieveFreeSmsCounts.mockReturnValue(
      okAsync(VERIFICATION_SMS_COUNT),
    )
  })

  describe('handleGetFreeSmsCountForFormAdmin', () => {
    it('should retrieve counts and msgSrvcId when the user and the form exist', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: mockForm._id,
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const expected: SmsCountsDto = {
        smsCounts: VERIFICATION_SMS_COUNT,
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(200)
      expect(mockRes.json).toBeCalledWith(expected)
    })

    it('should return 404 when the form is not found in the database', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: new ObjectId().toHexString(),
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      MockFormService.retrieveFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )
      const mockRes = expressHandler.mockResponse()
      const expected = {
        message:
          'Could not find the form requested. Please refresh and try again.',
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(404)
      expect(mockRes.json).toBeCalledWith(expected)
    })

    it('should return 500 when a database error occurs during form retrieval', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: mockForm._id,
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const retrieveSpy = jest.spyOn(FormService, 'retrieveFormById')
      retrieveSpy.mockReturnValueOnce(errAsync(new DatabaseError()))
      const expected = {
        message: 'Sorry, something went wrong. Please try again.',
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith(expected)
    })

    it('should return 500 when a database error occurs during count retrieval', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: mockForm._id,
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const retrieveSpy = jest.spyOn(SmsService, 'retrieveFreeSmsCounts')
      retrieveSpy.mockReturnValueOnce(errAsync(new DatabaseError()))
      const expected = {
        message: 'Sorry, something went wrong. Please try again.',
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith(expected)
    })
  })
})
