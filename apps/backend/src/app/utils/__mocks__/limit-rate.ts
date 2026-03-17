import { RequestHandler } from 'express'

// Remove rate limiting in tests.
export const limitRate = jest
  .fn()
  .mockImplementation((): RequestHandler => (req, res, next) => next())
