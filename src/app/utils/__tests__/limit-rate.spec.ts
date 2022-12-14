import RateLimit from 'express-rate-limit'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

jest.mock('express-rate-limit')
const MockRateLimit = jest.mocked(RateLimit)

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

  it('should return 429 when the rate limit is exceeded', () => {
    limitRate({ max: 0 })
    const handler = MockRateLimit.mock.calls[0][0]!.handler!
    const mockNext = jest.fn()
    const mockRes = expressHandler.mockResponse()
    handler(expressHandler.mockRequest(), mockRes, mockNext, {})
    expect(mockNext).not.toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(429)
    expect(mockRes.json).toHaveBeenCalledWith({
      message:
        'We are experiencing a temporary issue. Please try again in one minute.',
    })
  })
})
