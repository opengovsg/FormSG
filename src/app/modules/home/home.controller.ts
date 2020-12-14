import { RequestHandler } from 'express'

/**
 * Renders the root page of the application
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
export const home: RequestHandler = (_req, res) => {
  return res.render('index')
}
