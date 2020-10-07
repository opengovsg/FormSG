import RateLimit, {
  Options as RateLimitOptions,
  RateLimit as RateLimitFn,
} from 'express-rate-limit'
import { merge } from 'lodash'

import { createLoggerWithLabel } from '../../config/logger'

import { getMeta } from './request'

const logger = createLoggerWithLabel(module)

/**
 * Returns a middleware which logs a message if the rate of requests
 * to an API endpoint exceeds a given rate.
 * TODO (private #49): update this documentation.
 * @param options Custom options to be passed to RateLimit
 * @return Rate-limiting middleware
 */
export const limitRate = (options: RateLimitOptions = {}): RateLimitFn => {
  const defaultOptions: RateLimitOptions = {
    windowMs: 60 * 1000, // Apply rate per-minute
    max: 1200,
    handler: (req, _res, next) => {
      logger.warn({
        message: 'Rate limit exceeded',
        meta: {
          action: 'limitRate',
          ...getMeta(req),
          method: req.method,
          rateLimitInfo: req.rateLimit,
        },
      })
      // TODO (private #49): terminate the request with HTTP 429
      return next()
    },
  }
  return RateLimit(merge(defaultOptions, options))
}
