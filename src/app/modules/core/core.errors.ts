/**
 * Global error code registry.
 * TODO: Not sure how many errors there actually are in total and how big to make the segments
 * - Form Errors [1000 - 1099]
 *   - General Form Errors [100]
 * - Database Errors [1100 - 1199]
 * - Payment Errors [1200 - 1299]
 *   - Stripe Errors [1210 - 1219]
 * TODO: Should make one giant OTP 100 block
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
  // Billing Errors
  FormHasNoAuth = 1220,
  // Payment Proof Errors
  InvoicePdfGeneration = 1221,
  PaymentProofUploadS3 = 1222,
  PaymentProofPresignS3 = 1223,

  // Submission Errors [1300 - 1399]
  SubmissionConflict = 1300,
  SubmissionNotFound = 1301,
  PendingSubmissionNotFound = 1302,
  InvalidSubmissionType = 1303,
  InvalidEncoding = 1304,
  SubmissionProcessing = 1305,
  ValidateField = 1306,
  SendEmailConfirmation = 1307,
  WrongResponseMode = 1308,
  AttachmentTooLarge = 1309,
  InvalidFileExtension = 1310,
  SubmissionFailed = 1311,
  InvalidFieldId = 1312,
  AttachmentSizeLimitExceeded = 1313,
  FeatureDisabled = 1314,
  InvalidFileKey = 1315,
  VirusScanFailed = 1316,
  JsonParseFailed = 1317,
  DownloadCleanFileFailed = 1318,
  ParseVirusScannerLambdaPayload = 1319,
  MaliciousFileDetected = 1320,
  InvalidWorkflowType = 1321,
  // Encrypt Submission Errors
  FormsgReqBodyExists = 1322,
  EncryptedPayloadExists = 1323,
  // Email Submission Errors
  SubmissionHash = 1324,

  // Admin Form Errors [1400 - 1499]
  InvalidFileType = 1400,
  EditField = 1401,
  FieldNotFound = 1402,
  InvalidCollaborator = 1403,
  PaymentChannelNotFound = 1404,
  GoGov = 1405,
  GoGovValidation = 1406,
  GoGovAlreadyExist = 1407,
  GoGovRequestLimit = 1408,
  GoGovBadGateway = 1409,
  GoGovServer = 1410,

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

  // SPCP Errors [2050 - 2059]
  CreateRedirectUrl = 2050,
  VerifyJwt = 2051,
  MissingAttributes = 2052,
  InvalidJwt = 2053,
  MissingJwt = 2054,
  InvalidIdToken = 2055,
  InvalidState = 2056,
  CreateJwt = 2057,
  ExchangeAuthToken = 2058,

  // SgID Errors [2060 - 2069]
  SgidCreateRedirectUrl = 2060,
  SgidInvalidState = 2061,
  SgidFetchAccessToken = 2062,
  SgidFetchUserInfo = 2063,
  SgidMalformedMyInfoCookie = 2064,
  SgidVerifyJwt = 2065,
  SgidInvalidJwt = 2066,
  SgidMissingJwt = 2067,

  // Mail Errors [2070 - 2079]
  MailSend = 2071,
  MailGeneration = 2072,

  // MyInfo Errors [2080 - 2089]
  MyInfoCircuitBreaker = 2080,
  MyInfoFetch = 2081,
  MyInfoHashing = 2082,
  MyInfoMissingHash = 2083,
  MyInfoHashDidNotMatch = 2084,
  MyinfoParseRelayState = 2085,
  MyInfoMissingLoginCookie = 2086,
  MyInfoInvalidLoginCookie = 2087,
  MyInfoInvalidAuthCodeCookie = 2088,
  MyInfoCookieState = 2089,

  // Webhook Errors [2090 - 2099]
  WebhookValidation = 2090,
  WebhookFailedWithPresignedUrlGeneration = 2091,
  WebhookFailedWithUnknown = 2092,
  WebhookFailedWithAxios = 2093,
  WebhookQueueMessageParsing = 2094,
  WebhookNoMoreRetries = 2095,
  WebhookPushToQueue = 2096,
  WebhookRetriesNotEnabled = 2097,

  // Bounce Errors [2100 - 2109]
  InvalidNotification = 2100,
  SendBounceSmsNotification = 2101,
  MissingEmailHeaders = 2102,
  ParseNotification = 2103,

  // Feedback Errors [2110 - 2119]
  MissingAdminFeedback = 2110,
  InvalidSubmissionId = 2111,
  DuplicateFeedbackSubmission = 2112,

  // Workspace Errors [2120 - 2129]
  WorkspaceNotFound = 2120,
  ForbiddenWorkspace = 2121,

  // Turnstile Errors [2130 - 2139]
  TurnstileConnection = 2130,
  VerifyTurnstile = 2131,
  MissingTurnstile = 2132,

  // SPCP OIDC Client Errors [2140 - 2149]
  CreateAuthorisationUrl = 2140,
  OidcCreateJwt = 2141,
  GetSigningKey = 2142,
  GetDecryptionKey = 2143,
  GetVerificationKey = 2144,
  OidcInvalidIdToken = 2145,
  JwkShapeInvalid = 2146,
  MissingIdToken = 2147,
  VerificationKey = 2148,
  OidcExchangeAuthToken = 2149,

  // Postman SMS Errors [2150 - 2159]
  PostmanSmsSend = 2150,
  PostmanInvalidNumber = 2151,

  // Verification Errors [2160 - 2179]
  TransactionNotFound = 2160,
  FieldNotFoundInTransaction = 2161,
  TransactionExpired = 2162,
  OtpExpired = 2163,
  MissingHashData = 2164,
  OtpRetryExceeded = 2165,
  WrongOtp = 2166,
  WaitForOtp = 2167,
  OtpRequestCountExceeded = 2168,
  NonVerifiedFieldType = 2169,
  SmsLimitExceeded = 2170,
  OtpRequestError = 2171,

  // Receiver Errors [2180 - 2189]
  InitialiseMultipartReceiver = 2180,
  MultipartContentLimit = 2181,
  MultipartContentParsing = 2182,
  MultipartError = 2183,

  // Verified Content Error [2190 - 2199]
  MalformedVerifiedContent = 2190,
  EncryptVerifiedContent = 2191,
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
