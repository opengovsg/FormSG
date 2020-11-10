import { isEmpty } from 'lodash'

import { IMongoError } from 'src/types/error'

/**
 * Default error message if no more specific error
 */
const defaultErrorMessage = 'An unexpected error happened. Please try again.'

export const getMongoErrorMessage = (err?: IMongoError | string): string => {
  let message = ''
  if (!err) {
    return ''
  } else if (typeof err === 'string') {
    message = err
  } else if (err.code) {
    // Mongo error codes
    switch (err.code) {
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
