import { ObjectId } from 'bson-ext'
import moment from 'moment-timezone'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { AuthType, LoginStatistic } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseError } from '../../core/core.errors'
import * as BillingController from '../billing.controller'
import * as BillingService from '../billing.service'

jest.mock('../billing.service')
const MockBillingService = mocked(BillingService)

describe('billing.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleGetBillInfo', () => {
    const MOCK_REQ_QUERY = {
      esrvcId: 'some-esrvc-id',
      yr: '2020',
      mth: '10',
    }

    const MOCK_REQ = expressHandler.mockRequest({
      query: MOCK_REQ_QUERY,
      session: {
        user: {
          _id: new ObjectId().toHexString(),
        },
      },
    })

    const EXPECTED_SERVICE_CALL_ARGS = (() => {
      const expectedStartArg = moment
        .tz(
          [parseInt(MOCK_REQ_QUERY.yr), parseInt(MOCK_REQ_QUERY.mth)],
          'Asia/Singapore',
        )
        .startOf('month')
      const expectedEndArg = moment(expectedStartArg).endOf('month')

      return [
        MOCK_REQ_QUERY.esrvcId,
        expectedStartArg.toDate(),
        expectedEndArg.toDate(),
      ] as [esrvcId: string, minDate: Date, maxDate: Date]
    })()

    it('should return 200 with login statistics successfully', async () => {
      // Arrange
      const mockLoginStats: LoginStatistic[] = [
        {
          adminEmail: 'mockemail@example.com',
          authType: AuthType.CP,
          formId: 'mock form id',
          formName: 'some form name',
          total: 100,
        },
      ]
      const mockRes = expressHandler.mockResponse()
      // Mock BillingService to return valid statistics
      MockBillingService.getSpLoginStats.mockReturnValueOnce(
        okAsync(mockLoginStats),
      )

      // Act
      await BillingController.handleGetBillInfo(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(MockBillingService.getSpLoginStats).toHaveBeenCalledWith(
        ...EXPECTED_SERVICE_CALL_ARGS,
      )
      expect(mockRes.json).toBeCalledWith({ loginStats: mockLoginStats })
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock BillingService to return DatabaseError
      MockBillingService.getSpLoginStats.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await BillingController.handleGetBillInfo(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(MockBillingService.getSpLoginStats).toHaveBeenCalledWith(
        ...EXPECTED_SERVICE_CALL_ARGS,
      )
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith('Error in retrieving billing records')
    })
  })
})
