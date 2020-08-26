import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

/**
 * Precondition: AuthMiddlewares.validateDomain must precede this handler.
 * @returns 200 regardless, assumed to have passed domain validation.
 */
export const handleCheckUser: RequestHandler = async (_req, res) => {
  return res.sendStatus(HttpStatus.OK)
}
