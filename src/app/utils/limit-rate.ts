import RateLimit, {
  Options as RateLimitOptions,
  RateLimit as RateLimitFn,
} from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes'
import { merge } from 'lodash'

import { createLoggerWithLabel } from '../../config/logger'

import { createReqMeta } from './request'

const logger = createLoggerWithLabel(module)

/**
 * Returns a middleware which logs a message and returns 429 if the rate of requests
 * to an API endpoint exceeds a given rate.
 * @param options Custom options to be passed to RateLimit
 * @return Rate-limiting middleware
 */
export const limitRate = (options: RateLimitOptions = {}): RateLimitFn => {
  const defaultOptions: RateLimitOptions = {
    windowMs: 60 * 1000, // Apply rate per-minute
    max: 1200,
    handler: (req, res) => {
      logger.warn({
        message: 'Rate limit exceeded',
        meta: {
          action: 'limitRate',
          ...createReqMeta(req),
          method: req.method,
          rateLimitInfo: req.rateLimit,
        },
      })
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        message:
          'We are experiencing a temporary issue. Please try again in one minute.',
      })
    },
  }
  return RateLimit(merge(defaultOptions, options))
}
