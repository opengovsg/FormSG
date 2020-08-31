import HttpStatus from 'http-status-codes'
import { mocked } from 'ts-jest/utils'

import handleSns from 'src/app/modules/bounce/bounce.controller'
import * as bounceService from 'src/app/modules/bounce/bounce.service'

jest.mock('src/app/modules/bounce/bounce.service')
const mockBounceService = mocked(bounceService, true)

describe('handleSns', () => {
  let req, res
  beforeEach(() => {
    req = { body: 'somebody' }
    res = { sendStatus: jest.fn() }
  })
  afterEach(() => {
    mockBounceService.updateBounces.mockReset()
    mockBounceService.isValidSnsRequest.mockReset()
  })
  it('should not call updateBounces when requests are invalid', async () => {
    mockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(false),
    )
    await handleSns(req, res)
    expect(mockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(mockBounceService.updateBounces).not.toHaveBeenCalled()
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
  })
  it('should call updateBounces when requests are valid', async () => {
    mockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(true),
    )
    await handleSns(req, res)
    expect(mockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(mockBounceService.updateBounces).toHaveBeenCalledWith(req.body)
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.OK)
  })
  it('should return 400 when errors are thrown in isValidSnsRequest', async () => {
    mockBounceService.isValidSnsRequest.mockImplementation(() => {
      throw new Error()
    })
    await handleSns(req, res)
    expect(mockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(mockBounceService.updateBounces).not.toHaveBeenCalled()
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })
  it('should return 400 when errors are thrown in updateBounces', async () => {
    mockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(true),
    )
    mockBounceService.updateBounces.mockImplementation(() => {
      throw new Error()
    })
    await handleSns(req, res)
    expect(mockBounceService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(mockBounceService.updateBounces).toHaveBeenCalledWith(req.body)
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })
})
