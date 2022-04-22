import { Error as MongooseError, mongo as mongodb } from 'mongoose'

import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
  PossibleDatabaseError,
} from '../modules/core/core.errors'

const { MongoError } = mongodb

/**
 * Exported for testing.
 * Format error recovery message to be returned to client.
 * @param errMsg the error message
 */
export const formatErrorRecoveryMessage = (errMsg: string): string => {
  return `Error: [${errMsg}]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.`
}

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
        return formatErrorRecoveryMessage(
          'Your form is too large to be supported by the system.',
        )
      default:
        return formatErrorRecoveryMessage(defaultErrorMessage)
    }
  }

  // Handle mongoose errors
  if (err instanceof MongooseError.ValidationError) {
    // Deduplicate then Join all error messages into a single message if available.
    const messages = Object.values(err.errors).map((error) => error.message)
    const dedupMessages = [...new Set(messages)]
    const joinedMessage = dedupMessages.join(', ')

    return formatErrorRecoveryMessage(
      (joinedMessage || err.message) ?? defaultErrorMessage,
    )
  }

  if (err instanceof MongooseError || err instanceof Error) {
    return formatErrorRecoveryMessage(err.message ?? defaultErrorMessage)
  }

  if (typeof err === 'string') {
    return formatErrorRecoveryMessage(err ?? defaultErrorMessage)
  }

  return formatErrorRecoveryMessage(defaultErrorMessage)
}

/**
 * Transforms mongo returned errors into ApplicationErrors
 * @param error the error thrown by database operations
 * @returns errors that extend from ApplicationError class
 */
export const transformMongoError = (error: unknown): PossibleDatabaseError => {
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

export const isMongoError = (error: Error): boolean => {
  switch (error.constructor) {
    case DatabaseConflictError:
    case DatabaseError:
    case DatabasePayloadSizeError:
    case DatabaseValidationError:
      return true
    default:
      return false
  }
}
