import { MongoError } from 'mongodb'
import { Error as MongooseError } from 'mongoose'

import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from '../modules/core/core.errors'

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

/**
 * Transforms mongo returned errors into ApplicationErrors
 * @param error the error thrown by database operations
 * @returns errors that extend from ApplicationError class
 */
export const transformMongoError = (
  error: unknown,
):
  | DatabaseError
  | DatabaseValidationError
  | DatabaseConflictError
  | DatabasePayloadSizeError => {
  const errorMessage = getMongoErrorMessage(error)
  if (!(error instanceof Error)) {
    return new DatabaseError(errorMessage)
  }

  if (error instanceof MongooseError.ValidationError) {
    return new DatabaseValidationError(errorMessage)
  }

  if (error instanceof MongooseError.VersionError) {
    return new DatabaseConflictError(errorMessage)
  }

  if (
    // Exception when Mongoose breaches Mongo 16MB size limit.
    error instanceof RangeError ||
    // MongoDB Invalid BSON error.
    (error instanceof MongoError && error.code === 10334) ||
    // FormSG-imposed limit in pre-validate hook.
    error.name === 'FormSizeError'
  ) {
    return new DatabasePayloadSizeError(errorMessage)
  }

  return new DatabaseError(errorMessage)
}
