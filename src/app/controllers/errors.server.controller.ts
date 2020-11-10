import { isEmpty } from 'lodash'

import { IMongoError } from 'src/types/error'

/**
 * Default error message if no more specific error
 * @type {String}
 */
export const defaultErrorMessage =
  'An unexpected error happened. Please try again.'

const mongoDuplicateKeyError = function (err: IMongoError): string {
  let errorString = ''
  if (err.err) {
    const fieldName = err.err.substring(
      err.err.lastIndexOf('.$') + 2,
      err.err.lastIndexOf('_1'),
    )
    errorString =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists'
  } else {
    errorString = 'Unique field already exists'
  }
  return errorString
}

export function getMongoErrorMessage(err?: IMongoError | string): string {
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
        message = defaultErrorMessage
    }
  } else if (!isEmpty(err.errors)) {
    // Prefer specific error messages to a generic one
    const errMsgs = []
    for (const subError in err.errors) {
      errMsgs.push(err.errors[subError].message)
    }
    message = errMsgs.join(', ')
  } else {
    if (err.message) {
      message = err.message
    }
  }
  return message
}
