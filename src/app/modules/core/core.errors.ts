/**
 * Global error code registry.
 * TODO: Not sure how many errors there actually are in total and how big to make the segments
 * - Form Errors [1000 - 1099]
 *   - General Form Errors [100]
 * - Database Errors [1100 - 1199]
 * - Payment Errors [1200 - 1299]
 *   - Stripe Errors [1210 - 1219]
 *
 * Errors from the same feature start with the same multiple of 100 and
 * be contiguous.
 */
export enum ErrorCodes {
  // Form Errors [1000 - 1099]
  PrivateForm = 1001,
  FormNotFound = 1002,
  FormDeleted = 1003,
  ForbiddenForm = 1004,
  TransferOwnership = 1005,
  LogicNotFound = 1006,
  AuthTypeMismatch = 1007,
  FormAuthNoEsrveld = 1008,

  // Database Errors [1100 - 1199]
  DatabaseError = 1100,
  DatabaseValidation = 1101,
  DatabaseConflict = 1102,
  DatabasePayloadSize = 1103,
  DatabaseDuplicateKey = 1104,
  DatabaseWriteConflict = 1105,
  SecretsManager = 1106,
  SecretsManagerNotFound = 1107,
  SecretsManagerConflict = 1108,

  // Payment Errors [1200 - 1299]
  InvalidPaymentAmount = 1200,
  PaymentNotFound = 1201,
  ConfirmedPaymentNotFound = 1202,
  PaymentAlreadyConfirmed = 1203,
  PaymentAccountInformation = 1204,
  InvalidPaymentProducts = 1205,
  PaymentConfiguration = 1206,
  SuccessfulChargeNotFound = 1210,
  StripeTransactionFeeNotFound = 1211,
  MalformedStripeChargeObject = 1212,
  MalformedStripeEventObject = 1213,
  StripeMetadataInvalid = 1214,
  StripeMetadataValidPaymentIdNotFound = 1215,
  StripeMetadataIncorrectEnv = 1216,
  StripeFetch = 1217,
  StripeAccount = 1218,
  ComputePaymentState = 1219,

  // Twilio Errors [2000 - 2009]
  TwilioCache = 2000,
  MalformedParameters = 2001,
  AttachmentUpload = 2002,
  EmptyErrorField = 2003,

  // Captcha Errors [2010 - 2019]
  CaptchaConnection = 2010,
  VerifyCaptcha = 2011,
  MissingCaptcha = 2012,

  // Sms Errors [2020 - 2029]
  SmsSend = 2020,
  InvalidNumber = 2021,

  // User Errors [2030 - 2039]
  UserInvalidOtp = 2031,
  MissingUser = 2032,

  // Auth Errors [2040 - 2049]
  InvalidDomain = 2040,
  AuthInvalidOtp = 2041,
  InvalidToken = 2042,
  MissingToken = 2043,
}

/**
 * A custom base error class that encapsulates the name, message, status code,
 * and logging meta string (if any) for the error.
 */
export class ApplicationError extends Error {
  /**
   * Meta object to be logged by the application logger, if any.
   */
  meta?: unknown
  // FormSG Business Logic errors, not to be confused with HTTP Status Codes
  code?: number

  constructor(message?: string, meta?: unknown, errorCode?: number) {
    super()

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name

    this.message = message || 'Something went wrong. Please try again.'

    this.meta = meta
    this.code = errorCode
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message?: string) {
    super(message, undefined, ErrorCodes.DatabaseError)
  }
}

export class DatabaseValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DatabaseValidation)
  }
}

export class DatabaseConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DatabaseConflict)
  }
}

export class DatabasePayloadSizeError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DatabasePayloadSize)
  }
}

export class DatabaseDuplicateKeyError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DatabaseDuplicateKey)
  }
}

export class DatabaseWriteConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DatabaseWriteConflict)
  }
}

export class SecretsManagerError extends ApplicationError {
  constructor(message?: string) {
    super(message, undefined, ErrorCodes.SecretsManager)
  }
}

export class SecretsManagerNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.SecretsManagerNotFound)
  }
}

export class SecretsManagerConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.SecretsManagerConflict)
  }
}

export class TwilioCacheError extends ApplicationError {
  constructor(message?: string) {
    super(message, undefined, ErrorCodes.TwilioCache)
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
    super(message, meta, ErrorCodes.MalformedParameters)
  }
}

/**
 * Error thrown when attachment upload fails
 */
export class AttachmentUploadError extends ApplicationError {
  constructor(message = 'Error while uploading encrypted attachments to S3') {
    super(message, undefined, ErrorCodes.AttachmentUpload)
  }
}

/**
 * A custom error class returned when a method explicitly returns a list of errors
 * but the list itself is empty.
 */
export class EmptyErrorFieldError extends ApplicationError {
  constructor(message = 'Errors were returned but list is empty.') {
    super(message, undefined, ErrorCodes.EmptyErrorField)
  }
}
