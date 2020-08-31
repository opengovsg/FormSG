import HttpStatus from 'http-status-codes'
import { mocked } from 'ts-jest/utils'

import handleSns from 'src/app/modules/bounce/bounce.controller'
import * as BounceService from 'src/app/modules/bounce/bounce.service'

jest.mock('src/app/modules/bounce/bounce.service')
const MockBounceService = mocked(BounceService, true)

describe('handleSns', () => {
  let req, res

  beforeEach(() => {
    req = { body: 'somebody' }
    res = { sendStatus: jest.fn() }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should not call updateBounces when requests are invalid', async () => {
    MockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(false),
    )
    await handleSns(req, res)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(MockBounceService.updateBounces).not.toHaveBeenCalled()
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
  })

  it('should call updateBounces when requests are valid', async () => {
    MockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(true),
    )
    await handleSns(req, res)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(MockBounceService.updateBounces).toHaveBeenCalledWith(req.body)
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.OK)
  })

  it('should return 400 when errors are thrown in isValidSnsRequest', async () => {
    MockBounceService.isValidSnsRequest.mockImplementation(() => {
      throw new Error()
    })
    await handleSns(req, res)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(MockBounceService.updateBounces).not.toHaveBeenCalled()
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 when errors are thrown in updateBounces', async () => {
    MockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(true),
    )
    MockBounceService.updateBounces.mockImplementation(() => {
      throw new Error()
    })
    await handleSns(req, res)
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(MockBounceService.updateBounces).toHaveBeenCalledWith(req.body)
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })
})
