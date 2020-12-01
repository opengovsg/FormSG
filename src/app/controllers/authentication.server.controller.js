'use strict'

/**
 * Module dependencies.
 */
const { StatusCodes } = require('http-status-codes')
const {
  PermissionLevel,
} = require('../modules/form/admin-form/admin-form.types')
const {
  assertHasReadPermissions,
  assertHasWritePermissions,
  assertHasDeletePermissions,
} = require('../modules/form/admin-form/admin-form.utils')
const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)

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
      ...createReqMeta(req),
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
    let result
    switch (requiredPermission) {
      case PermissionLevel.Read:
        result = assertHasReadPermissions(req.session.user, req.form)
        break
      case PermissionLevel.Write:
        result = assertHasWritePermissions(req.session.user, req.form)
        break
      case PermissionLevel.Delete:
        result = assertHasDeletePermissions(req.session.user, req.form)
        break
      default:
        logger.error({
          message:
            'Unknown permission type encountered when verifying permissions',
          meta: {
            action: 'verifyPermission',
            ...createReqMeta(req),
          },
        })
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Unknown permission type',
        })
    }

    if (result.isErr()) {
      logUnauthorizedAccess(req, 'verifyPermission', requiredPermission)
      return res.status(StatusCodes.FORBIDDEN).json({
        message: result.error.message,
      })
    }

    // No error, pass to next function.
    return next()
  }
