import HttpStatus from 'http-status-codes'
import { mocked } from 'ts-jest/utils'

import handleSns from 'src/app/modules/sns/sns.controller'
import * as snsService from 'src/app/modules/sns/sns.service'

jest.mock('src/app/modules/sns/sns.service')
const mockSnsService = mocked(snsService, true)

describe('handleSns', () => {
  let req, res
  beforeEach(() => {
    req = { body: 'somebody' }
    res = { sendStatus: jest.fn() }
  })
  afterEach(() => {
    mockSnsService.updateBounces.mockReset()
    mockSnsService.isValidSnsRequest.mockReset()
  })
  test('does not call updateBounces for invalid requests', async () => {
    mockSnsService.isValidSnsRequest.mockImplementation(() =>
      Promise.resolve(false),
    )
    await handleSns(req, res)
    expect(mockSnsService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(mockSnsService.updateBounces).not.toHaveBeenCalled()
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
  })
  test('calls updateBounces for valid requests', async () => {
    mockSnsService.isValidSnsRequest.mockImplementation(() =>
      Promise.resolve(true),
    )
    await handleSns(req, res)
    expect(mockSnsService.isValidSnsRequest).toHaveBeenCalledWith(req.body)
    expect(mockSnsService.updateBounces).toHaveBeenCalledWith(req.body)
    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.OK)
  })
})
