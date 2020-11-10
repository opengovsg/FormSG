'use strict'

import _ from 'lodash'

/**
 * Default error message if no more specific error
 * @type {String}
 */
exports.defaultErrorMessage = 'An unexpected error happened. Please try again.'

/**
 * Private helper for getMongoErrorMessage to return Mongo error in a String
 * @param  {Object} err - MongoDB error object
 * @return {String} errorString - Formatted error string
 */
const mongoDuplicateKeyError = function (err) {
  let errorString = ''
  try {
    const fieldName = err.err.substring(
      err.err.lastIndexOf('.$') + 2,
      err.err.lastIndexOf('_1'),
    )
    errorString =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists'
  } catch (ex) {
    errorString = 'Unique field already exists'
  }
  return errorString
}

/**
 * Gets Mongo error object and returns formatted String for frontend
 * @param  {Objrct} err MongoDB error object
 * @return {String} message - Error message returned to frontend
 */
exports.getMongoErrorMessage = function (err) {
  let message = ''
  if (!err) {
    return ''
  } else if (typeof err === 'string') {
    message = err
  } else if (err.code) {
    // Mongo error codes
    switch (err.code) {
      case 11000: // Duplicate key errors
      case 11001:
        message = mongoDuplicateKeyError(err)
        break
      case 10334: // BSONObj size invalid error
        message = 'Your form is too large to be supported by the system.'
        break
      default:
        message = exports.defaultErrorMessage
    }
  } else if (!_.isEmpty(err.errors)) {
    // Prefer specific error messages to a generic one
    const errMsgs = []
    for (const subError in err.errors) {
      errMsgs.push(err.errors[subError].message)
    }
    message = errMsgs.join(', ')
  } else {
    message = err.message
  }
  return message
}
