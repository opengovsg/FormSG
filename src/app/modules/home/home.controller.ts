import { ControllerHandler } from '../core/core.types'

/**
 * Renders the root page of the application.
 * @param  req - Express request object
 * @param  res - Express response object
 */
export const home: ControllerHandler = (_req, res) => {
  return res.render('index')
}
