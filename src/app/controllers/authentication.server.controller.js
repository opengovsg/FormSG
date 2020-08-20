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
 * Checks if domain is from a whitelisted agency
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.validateDomain = function (req, res, next) {
  let email = req.body.email
  let emailDomain = String(validator.isEmail(email) && email.split('@').pop())
  Agency.findOne({ emailDomain }, function (err, agency) {
    // Database issues
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(
          `Unable to validate email domain. If this issue persists, please submit a Support Form (${LINKS.supportFormLink}).`,
        )
    }
    // Agency not found
    if (!agency) {
      logger.error({
        message: 'Agency not found',
        meta: {
          action: 'validateDomain',
          email,
          emailDomain,
          ip: getRequestIp(req),
        },
        error: err,
      })
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send(
          'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
        )
    }
    // Agency whitelisted
    res.locals = {
      agency,
      email,
    }
    return next()
  })
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
    if (!isFormAdmin && requiredPermission === PERMISSIONS.ADMIN) {
      logger.error(
        `User ${req.session.uer} not authorized to perform ${requiredPermission} operation on Form: ${req.form.title}.`,
      )
      return res.status(HttpStatus.FORBIDDEN).send({
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
      logger.error(
        `User ${req.session.uer} not authorized to perform ${requiredPermission} operation on Form: ${req.form.title}.`,
      )
      return res.status(HttpStatus.FORBIDDEN).send({
        message: makeUnauthorizedMessage(
          req.session.user.email,
          req.form.title,
        ),
      })
    }
    return next()
  }
