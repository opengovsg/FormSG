import RateLimit, {
  Options as RateLimitOptions,
  Store,
} from 'express-rate-limit'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

jest.mock('express-rate-limit')
const MockRateLimit = jest.mocked(RateLimit)

// eslint-disable-next-line import/first
import { limitRate } from 'src/app/utils/limit-rate'

/**
 * express-rate-limit passes this set of options to the
 * custom handler we specify. When we test our custom
 * handler, we should make sure that it behaves correctly
 * when these options are passed in.
 */
const MOCK_OPTIONS: RateLimitOptions = {
  windowMs: 60000,
  max: 5,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  legacyHeaders: true,
  standardHeaders: false,
  requestPropertyName: 'rateLimit',
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  keyGenerator: () => '0.0.0.0',
  handler: (_req, res) => res.status(429).send('Too many requests'),
  onLimitReached: (_req, res) => res.sendStatus(200),
  skip: () => false,
  requestWasSuccessful: () => true,
  store: {} as Store,
}

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
    limitRate({ max: 5, windowMs: 10 })
    expect(MockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ max: 5, windowMs: 10 }),
    )
  })

  it('should return 429 when the rate limit is exceeded', () => {
    limitRate({ max: 0 })
    const handler = MockRateLimit.mock.calls[0][0]!.handler!
    const mockNext = jest.fn()
    const mockRes = expressHandler.mockResponse()
    handler(expressHandler.mockRequest(), mockRes, mockNext, MOCK_OPTIONS)
    expect(mockNext).not.toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(429)
    expect(mockRes.json).toHaveBeenCalledWith({
      message:
        'We are experiencing a temporary issue. Please try again in one minute.',
    })
  })
})
