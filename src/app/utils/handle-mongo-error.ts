import { MongoError } from 'mongodb'
import { Error as MongooseError } from 'mongoose'

export const getMongoErrorMessage = (
  err?: unknown,
  // Default error message if no more specific error
  defaultErrorMessage = 'An unexpected error happened. Please try again.',
): string => {
  if (!err) {
    return ''
  }

  // Handle base Mongo engine errors
  if (err instanceof MongoError) {
    switch (err.code) {
      case 10334: // BSONObj size invalid error
        return 'Your form is too large to be supported by the system.'
      default:
        return defaultErrorMessage
    }
  }

  // Handle mongoose errors
  if (err instanceof MongooseError.ValidationError) {
    // Join all error messages into a single message if available.
    const joinedMessage = Object.values(err.errors)
      .map((err) => err.message)
      .join(', ')

    return joinedMessage ?? err.message ?? defaultErrorMessage
  }

  if (err instanceof MongooseError || err instanceof Error) {
    return err.message ?? defaultErrorMessage
  }

  if (typeof err === 'string') {
    return err ?? defaultErrorMessage
  }

  return defaultErrorMessage
}
