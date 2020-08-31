import HttpStatus from 'http-status-codes'
import expressHandler from 'tests/unit/backend/helpers/jest-express'
import { mocked } from 'ts-jest/utils'

import handleSns from 'src/app/modules/bounce/bounce.controller'
import * as BounceService from 'src/app/modules/bounce/bounce.service'

jest.mock('src/app/modules/bounce/bounce.service')
const MockBounceService = mocked(BounceService, true)

const MOCK_REQ = expressHandler.mockRequest({ body: { someKey: 'someValue' } })
const MOCK_RES = expressHandler.mockResponse()

describe('handleSns', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should not call updateBounces when requests are invalid', async () => {
    MockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(false),
    )
    await handleSns(MOCK_REQ, MOCK_RES)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.updateBounces).not.toHaveBeenCalled()
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
  })

  it('should call updateBounces when requests are valid', async () => {
    MockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(true),
    )
    await handleSns(MOCK_REQ, MOCK_RES)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.updateBounces).toHaveBeenCalledWith(MOCK_REQ.body)
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(HttpStatus.OK)
  })

  it('should return 400 when errors are thrown in isValidSnsRequest', async () => {
    MockBounceService.isValidSnsRequest.mockImplementation(() => {
      throw new Error()
    })
    await handleSns(MOCK_REQ, MOCK_RES)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.updateBounces).not.toHaveBeenCalled()
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 when errors are thrown in updateBounces', async () => {
    MockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(true),
    )
    MockBounceService.updateBounces.mockImplementation(() => {
      throw new Error()
    })
    await handleSns(MOCK_REQ, MOCK_RES)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.updateBounces).toHaveBeenCalledWith(MOCK_REQ.body)
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })
})
