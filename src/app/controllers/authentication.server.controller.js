'use strict'

/**
 * Module dependencies.
 */
const { StatusCodes } = require('http-status-codes')
const PERMISSIONS = require('../utils/permission-levels').default
const { getRequestIp, getTrace } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)

/**
 * Middleware that authenticates admin-user
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
exports.authenticateUser = function (req, res, next) {
  if (req.session && req.session.user) {
    return next()
  } else {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'User is unauthorized.' })
  }
}

/**
 * Returns the error message when a user cannot perform an action on a form
 * @param {String} user -  user email
 * @param {String} title -  form title
 * @returns {String} - the error message
 */
const makeUnauthorizedMessage = (user, title) => {
  return `User ${user} is not authorized to perform this operation on Form: ${title}.`
}

/**
 * Logs an error message when a user cannot perform an action on a form
 * @param {String} user -  user email
 * @param {String} requiredPermission -  level of permission required
 * @param {String} form -  form
 * @returns {String} - the error message
 */
const logUnauthorizedAccess = (req, action, requiredPermission) => {
  const user = req.session.user
  const form = req.form
  const msg = `User ${user.email} not authorized to perform ${requiredPermission} operation on Form ${form._id} with title: ${form.title}.`
  logger.error({
    message: msg,
    meta: {
      action: action,
      ip: getRequestIp(req),
      trace: getTrace(req),
      url: req.url,
      headers: req.headers,
    },
    error: Error(msg),
  })
}

/**
 * Returns a middleware function that ensures that only users with the requiredPermission will pass.
 * @param {String} requiredPermission - one of PERMISSION_LEVELS, indicating the level of authorization required
 * @returns {function({Object}, {Object}, {Object})} - A middleware function that takes req, the express
 *   request object, and res, the express response object.
 */
exports.verifyPermission = (requiredPermission) =>
  /**
   * Middleware function that ensures only those with the required permission level will pass.
   * @param {Object} req - Express request object
   * @param {Object} req.form - The form object retrieved from the DB
   * @param {Object} req.session - The session info of the query
   * @param {Object} res - Express response object
   * @param {function} next - Next middleware function
   */
  (req, res, next) => {
    const isFormAdmin =
      String(req.form.admin.id) === String(req.session.user._id)

    // Forbidden if requiredPersmission is admin but user is not
    if (!isFormAdmin && requiredPermission === PERMISSIONS.DELETE) {
      logUnauthorizedAccess(req, 'verifyPermission', requiredPermission)
      return res.status(StatusCodes.FORBIDDEN).json({
        message: makeUnauthorizedMessage(
          req.session.user.email,
          req.form.title,
        ),
      })
    }

    // Admins always have sufficient permission
    let hasSufficientPermission = isFormAdmin

    // Write users can access forms that require write/read
    if (
      requiredPermission === PERMISSIONS.WRITE ||
      requiredPermission === PERMISSIONS.READ
    ) {
      hasSufficientPermission =
        hasSufficientPermission ||
        req.form.permissionList.find(
          (userObj) =>
            userObj.email === req.session.user.email && userObj.write,
        )
    }
    // Read users can access forms that require read permissions
    if (requiredPermission === PERMISSIONS.READ) {
      hasSufficientPermission =
        hasSufficientPermission ||
        req.form.permissionList.find(
          (userObj) => userObj.email === req.session.user.email,
        )
    }

    if (!hasSufficientPermission) {
      logUnauthorizedAccess(req, 'verifyPermission', requiredPermission)
      return res.status(StatusCodes.FORBIDDEN).json({
        message: makeUnauthorizedMessage(
          req.session.user.email,
          req.form.title,
        ),
      })
    }
    return next()
  }
