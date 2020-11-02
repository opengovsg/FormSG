'use strict'

const { StatusCodes } = require('http-status-codes')

/**
 * Checks if form is public
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
exports.isFormPublic = function (req, res, next) {
  switch (req.form.status) {
    case 'PUBLIC':
      return next()
    case 'ARCHIVED':
      return res.sendStatus(StatusCodes.GONE)
    default:
      return res.status(StatusCodes.NOT_FOUND).json({
        message: req.form.inactiveMessage,
        isPageFound: true, // Flag to prevent default 404 subtext ("please check link") from showing
        formTitle: req.form.title,
      })
  }
}
