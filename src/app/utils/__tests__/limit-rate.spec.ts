import RateLimit from 'express-rate-limit'
import expressHandler from 'tests/unit/backend/helpers/jest-express'
import { mocked } from 'ts-jest/utils'

jest.mock('express-rate-limit')
const MockRateLimit = mocked(RateLimit, true)

// eslint-disable-next-line import/first
import { limitRate } from 'src/app/utils/limit-rate'

const MOCK_MAX = 5
const MOCK_WINDOW = 10

describe('limitRate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should create a rate-limiting middleware with defaults', () => {
    limitRate()
    expect(MockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ windowMs: 60000, max: 1200 }),
    )
  })

  it('should create a rate-limiting middleware with custom options', () => {
    limitRate({ max: MOCK_MAX, windowMs: MOCK_WINDOW })
    expect(MockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ windowMs: MOCK_WINDOW, max: MOCK_MAX }),
    )
  })

  it('should call next() in the handler', () => {
    limitRate()
    const handler = MockRateLimit.mock.calls[0][0]!.handler!
    const mockNext = jest.fn()
    handler(
      expressHandler.mockRequest(),
      expressHandler.mockResponse(),
      mockNext,
    )
    expect(mockNext).toHaveBeenCalled()
  })
})
