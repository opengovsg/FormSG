/**
 * A custom base error class that encapsulates the name, message, status code,
 * and logging meta string (if any) for the error.
 */
export class ApplicationError extends Error {
  /**
   * Meta object to be logged by the application logger, if any.
   */
  meta?: unknown

  constructor(message?: string, meta?: unknown) {
    super()

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name

    this.message = message || 'Something went wrong. Please try again.'

    this.meta = meta
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message?: string) {
    super(message)
  }
}

export class DatabaseValidationError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class DatabaseConflictError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class DatabasePayloadSizeError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class DatabaseDuplicateKeyError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class DatabaseWriteConflictError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class SecretsManagerError extends ApplicationError {
  constructor(message?: string) {
    super(message)
  }
}

export class SecretsManagerNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class SecretsManagerConflictError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class TwilioCacheError extends ApplicationError {
  constructor(message?: string) {
    super(message)
  }
}

/**
 * Union of all possible database errors
 */
export type PossibleDatabaseError =
  | DatabaseError
  | DatabaseValidationError
  | DatabaseConflictError
  | DatabasePayloadSizeError
  | DatabaseDuplicateKeyError
  | DatabaseWriteConflictError

export class MalformedParametersError extends ApplicationError {
  constructor(message: string, meta?: unknown) {
    super(message, meta)
  }
}

/**
 * Error thrown when attachment upload fails
 */
export class AttachmentUploadError extends ApplicationError {
  constructor(message = 'Error while uploading encrypted attachments to S3') {
    super(message)
  }
}

/**
 * A custom error class returned when a method explicitly returns a list of errors
 * but the list itself is empty.
 */
export class EmptyErrorFieldError extends ApplicationError {
  constructor(message = 'Errors were returned but list is empty.') {
    super(message)
  }
}
