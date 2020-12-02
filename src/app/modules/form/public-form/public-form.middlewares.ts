'use strict'

import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { WithForm } from '../../../../types'
/**
 * Checks if form is public
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
export const isFormPublic: RequestHandler = (req, res, next) => {
  const { form } = req as WithForm<typeof req>
  switch (form.status) {
    case 'PUBLIC':
      return next()
    case 'ARCHIVED':
      return res.sendStatus(StatusCodes.GONE)
    default:
      return res.status(StatusCodes.NOT_FOUND).json({
        message: form.inactiveMessage,
        isPageFound: true, // Flag to prevent default 404 subtext ("please check link") from showing
        formTitle: form.title,
      })
  }
}
