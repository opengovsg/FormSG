'use strict'

/**
 * Module dependencies.
 */
const { StatusCodes } = require('http-status-codes')

const PERMISSIONS = require('../utils/permission-levels').default

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
      .send({ message: 'User is unauthorized.' })
  }
}

/**
 * Returns a middleware function that ensures that only users with the requiredPermission will pass.
 * @param {String} requiredPermission - Either 'write' or 'delete', indicating what level of authorization
 *                                   the user needs
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
    // Admins always have sufficient permission
    let hasSufficientPermission =
      String(req.form.admin.id) === String(req.session.user._id)
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

    if (hasSufficientPermission) {
      return next()
    } else {
      return res.status(StatusCodes.FORBIDDEN).send({
        message:
          'User ' +
          req.session.user.email +
          ' is not authorized to perform this operation on Form: ' +
          req.form.title +
          '.',
      })
    }
  }
