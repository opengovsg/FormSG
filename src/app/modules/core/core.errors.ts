import { setErrorCode } from '../datadog/datadog.utils'

/**
 * Global Error Code Registry
 *
 * - [10xxxx] FormSG Errors
 * - [11xxxx] Auth Errors
 * - [12xxxx] Database Errors
 * - [13xxxx] Payment Errors
 * - [14xxxx] Communication Channel Errors
 * - [15xxxx] Verification Errors
 * - [19xxxx] Other Errors
 */
export enum ErrorCodes {
  // [10xxxx] FormSG Errors ---
  // [100000 - 100099] General
  FORM_PRIVATE_FORM = 100000,
  FORM_NOT_FOUND = 100001,
  FORM_DELETED = 100002,
  FORM_FORBIDDEN_FORM = 100003,
  FORM_TRANSFER_OWNERSHIP = 100004,
  FORM_LOGIC_NOT_FOUND = 100005,
  FORM_AUTH_TYPE_MISMATCH = 100006,
  FORM_AUTH_NO_ESRVC_ID = 100007,
  // [100100 - 100199] Submission Errors
  SUBMISSION_CONFLICT = 100100,
  SUBMISSION_NOT_FOUND = 100101,
  SUBMISSION_PENDING_NOT_FOUND = 100102,
  SUBMISSION_INVALID_TYPE = 100103,
  SUBMISSION_INVALID_ENCODING = 100104,
  SUBMISSION_PROCESSING = 100105,
  SUBMISSION_VALIDATE_FIELD = 100106,
  SUBMISSION_SEND_EMAIL_CONFIRMATION = 100107,
  SUBMISSION_WRONG_RESPONSE_MODE = 100108,
  SUBMISSION_ATTACHMENT_TOO_LARGE = 100109,
  SUBMISSION_INVALID_FILE_EXTENSION = 100110,
  SUBMISSION_FAILED = 100111,
  SUBMISSION_INVALID_FIELD_ID = 100112,
  SUBMISSION_ATTACHMENT_SIZE_LIMIT_EXCEEDED = 100113,
  SUBMISSION_FEATURE_DISABLED = 100114,
  SUBMISSION_INVALID_FILE_KEY = 100115,
  SUBMISSION_VIRUS_SCAN_FAILED = 100116,
  SUBMISSION_JSON_PARSE_FAILED = 100117,
  SUBMISSION_DOWNLOAD_CLEAN_FILE_FAILED = 100118,
  SUBMISSION_PARSE_VIRUS_SCANNER_LAMBDA_PAYLOAD = 100119,
  SUBMISSION_MALICIOUS_FILE_DETECTED = 100120,
  SUBMISSION_INVALID_WORKFLOW_TYPE = 100121,
  // Receiver Errors
  InitialiseMultipartReceiver = 100122,
  MultipartContentLimit = 100123,
  MultipartContentParsing = 100124,
  MultipartError = 100125,
  // Encrypt Submission Errors
  FormsgReqBodyExists = 100126,
  EncryptedPayloadExists = 100127,
  // Email Submission Errors
  SubmissionHash = 100128,
  // [100200 - 100299] Feedback Errors
  MissingAdminFeedback = 100200,
  InvalidSubmissionId = 100201,
  DuplicateFeedbackSubmission = 100202,
  // [100300 - 100399] Workspace Errors
  WorkspaceNotFound = 100300,
  ForbiddenWorkspace = 100301,
  // [100400 - 100499] Admin Form Errors
  InvalidFileType = 100400,
  EditField = 100401,
  FieldNotFound = 100402,
  InvalidCollaborator = 100403,
  PaymentChannelNotFound = 100404,
  GoGov = 100405,
  GoGovValidation = 100406,
  GoGovAlreadyExist = 100407,
  GoGovRequestLimit = 100408,
  GoGovBadGateway = 100409,
  GoGovServer = 100410,
  // End FormSG Errors ---

  // [11xxxx] Auth Errors ---
  // [110000 - 110099] General Auth Errors
  InvalidDomain = 110000,
  AuthInvalidOtp = 110001,
  InvalidToken = 110002,
  MissingToken = 110003,
  Unauthorized = 110004,
  CaptchaConnection = 110005,
  VerifyCaptcha = 110006,
  MissingCaptcha = 110007,
  // [110100 - 110199] SPCP Errors
  CreateRedirectUrl = 110100,
  VerifyJwt = 110101,
  MissingAttributes = 110102,
  InvalidJwt = 110103,
  MissingJwt = 110104,
  InvalidIdToken = 110105,
  InvalidState = 110106,
  CreateJwt = 110107,
  ExchangeAuthToken = 110108,
  // SPCP OIDC Client Errors
  CreateAuthorisationUrl = 110109,
  OidcCreateJwt = 110110,
  GetSigningKey = 110111,
  GetDecryptionKey = 110112,
  GetVerificationKey = 110113,
  OidcInvalidIdToken = 110114,
  JwkShapeInvalid = 110115,
  MissingIdToken = 110116,
  VerificationKey = 110117,
  OidcExchangeAuthToken = 110118,
  // [110200 - 110299] MyInfo Errors
  MyInfoCircuitBreaker = 110201,
  MyInfoFetch = 110202,
  MyInfoHashing = 110203,
  MyInfoMissingHash = 110204,
  MyInfoHashDidNotMatch = 110205,
  MyinfoParseRelayState = 110206,
  MyInfoMissingLoginCookie = 110207,
  MyInfoInvalidLoginCookie = 110208,
  MyInfoInvalidAuthCodeCookie = 110209,
  MyInfoCookieState = 110210,
  // [110300 - 110399] SgID Errors
  SgidCreateRedirectUrl = 110300,
  SgidInvalidState = 110301,
  SgidFetchAccessToken = 110302,
  SgidFetchUserInfo = 110303,
  SgidMalformedMyInfoCookie = 110304,
  SgidVerifyJwt = 110305,
  SgidInvalidJwt = 110306,
  SgidMissingJwt = 110307,
  // End of Auth Errors ---

  // [12xxxx] Database Errors ---
  DatabaseError = 120000,
  DatabaseValidation = 120001,
  DatabaseConflict = 120002,
  DatabasePayloadSize = 120003,
  DatabaseDuplicateKey = 120004,
  DatabaseWriteConflict = 120005,
  SecretsManager = 120006,
  SecretsManagerNotFound = 120007,
  SecretsManagerConflict = 120008,
  // End of Database Errors ---

  // [13xxxx] Payment Errors ---
  // [130000 - 130099] General Payment Errors
  InvalidPaymentAmount = 130000,
  PaymentNotFound = 130001,
  ConfirmedPaymentNotFound = 130002,
  PaymentAlreadyConfirmed = 130003,
  PaymentAccountInformation = 130004,
  InvalidPaymentProducts = 130005,
  PaymentConfiguration = 130006,
  // [130100 - 130199] Stripe Errors
  SuccessfulChargeNotFound = 130100,
  StripeTransactionFeeNotFound = 130101,
  MalformedStripeChargeObject = 130102,
  MalformedStripeEventObject = 130103,
  StripeMetadataInvalid = 130104,
  StripeMetadataValidPaymentIdNotFound = 130105,
  StripeMetadataIncorrectEnv = 130106,
  StripeFetch = 130107,
  StripeAccount = 130108,
  ComputePaymentState = 130109,
  // [130200 - 130299] Billing Errors
  FormHasNoAuth = 130200,
  // [130300 - 130399] Payment Proof Errors
  InvoicePdfGeneration = 130300,
  PaymentProofUploadS3 = 130301,
  PaymentProofPresignS3 = 130302,
  // End of Payment Errors ---

  // [14xxxx] Communication Channel Errors (SMS, Email, Webhook) ---
  // [140000 - 140099] SMS Errors
  TwilioCache = 140000,
  SmsSend = 140001,
  InvalidNumber = 140002,
  SmsLimitExceeded = 140003,
  UserInvalidOtp = 140004,
  // [140100 - 140199] Mail Errors
  MailSend = 140100,
  MailGeneration = 140101,
  // [140200 - 140299] Webhook Errors
  WebhookValidation = 140200,
  WebhookFailedWithPresignedUrlGeneration = 140201,
  WebhookFailedWithUnknown = 140202,
  WebhookFailedWithAxios = 140203,
  WebhookQueueMessageParsing = 140204,
  WebhookNoMoreRetries = 140205,
  WebhookPushToQueue = 140206,
  WebhookRetriesNotEnabled = 140207,
  // [140300 - 140399] Bounce Errors
  InvalidNotification = 140300,
  SendBounceSmsNotification = 140301,
  MissingEmailHeaders = 140302,
  ParseNotification = 140303,
  // End of Communication Channel Errors ---

  // [15xxxx] Verification Errors
  TransactionNotFound = 150000,
  FieldNotFoundInTransaction = 150001,
  TransactionExpired = 150002,
  OtpExpired = 150003,
  MissingHashData = 150004,
  OtpRetryExceeded = 150005,
  WrongOtp = 150006,
  WaitForOtp = 150007,
  OtpRequestCountExceeded = 150008,
  NonVerifiedFieldType = 150009,
  OtpRequestError = 150010,
  // End of Verification Errors ---

  // [19xxxx] Other Errors ---
  // [190000 - 190099] Core Errors
  MalformedParameters = 190000,
  AttachmentUpload = 190001,
  EmptyErrorField = 190002,
  // [190100 - 190199] User Errors
  MissingUser = 190100,
  // [190200 - 190299] Turnstile Errors
  TurnstileConnection = 190200,
  VerifyTurnstile = 190201,
  MissingTurnstile = 190202,
  // [190300 - 190399] Verified Content Errors
  MalformedVerifiedContent = 190300,
  EncryptVerifiedContent = 190301,
  // End of Other Errors ---
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

    this.name = this.constructor.name
    const defaultMessage = 'Something went wrong. Please try again.'
    this.message = errorCode
      ? `[${errorCode}] ${message || defaultMessage}`
      : message || defaultMessage
    Error.captureStackTrace(this, this.constructor)

    this.meta = meta
    this.code = errorCode

    if (this.code) {
      setErrorCode(this)
    }
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
