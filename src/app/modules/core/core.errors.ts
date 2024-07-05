/**
 * Global Error Code Registry
 *
 * - [10xx] FormSG Errors
 * - [11xx] Auth Errors
 * - [12xx] Database Errors
 * - [13xx] Payment Errors
 * - [14xx] Communication Channel Errors
 * - [15xx] Verification Errors
 * - [19xx] Other Errors
 */
export enum ErrorCodes {
  // [10xx] FormSG Errors ---
  // [1000 - 1009] General
  PrivateForm = 1000,
  FormNotFound = 1001,
  FormDeleted = 1002,
  ForbiddenForm = 1003,
  TransferOwnership = 1004,
  LogicNotFound = 1005,
  AuthTypeMismatch = 1006,
  FormAuthNoEsrvcId = 1007,
  // [1010 - 1039] Submission Errors
  SubmissionConflict = 1010,
  SubmissionNotFound = 1011,
  PendingSubmissionNotFound = 1012,
  InvalidSubmissionType = 1013,
  InvalidEncoding = 1014,
  SubmissionProcessing = 1015,
  ValidateField = 1016,
  SendEmailConfirmation = 1017,
  WrongResponseMode = 1018,
  AttachmentTooLarge = 1019,
  InvalidFileExtension = 1020,
  SubmissionFailed = 1021,
  InvalidFieldId = 1022,
  AttachmentSizeLimitExceeded = 1023,
  FeatureDisabled = 1024,
  InvalidFileKey = 1025,
  VirusScanFailed = 1026,
  JsonParseFailed = 1027,
  DownloadCleanFileFailed = 1028,
  ParseVirusScannerLambdaPayload = 1029,
  MaliciousFileDetected = 1030,
  InvalidWorkflowType = 1031,
  // Receiver Errors
  InitialiseMultipartReceiver = 1032,
  MultipartContentLimit = 1033,
  MultipartContentParsing = 1034,
  MultipartError = 1035,
  // [1040 - 1049] Encrypt Submission Errors
  FormsgReqBodyExists = 1040,
  EncryptedPayloadExists = 1041,
  // [1050 - 1059] Email Submission Errors
  SubmissionHash = 1050,
  // [1060 - 1069] Feedback Errors
  MissingAdminFeedback = 1060,
  InvalidSubmissionId = 1061,
  DuplicateFeedbackSubmission = 1062,
  // [1070 - 1079] Workspace Errors
  WorkspaceNotFound = 1070,
  ForbiddenWorkspace = 1071,
  // [1080 - 1099] Admin Form Errors
  InvalidFileType = 1080,
  EditField = 1081,
  FieldNotFound = 1082,
  InvalidCollaborator = 1083,
  PaymentChannelNotFound = 1084,
  GoGov = 1085,
  GoGovValidation = 1086,
  GoGovAlreadyExist = 1087,
  GoGovRequestLimit = 1088,
  GoGovBadGateway = 1089,
  GoGovServer = 1090,
  // End FormSG Errors ---

  // [11xx] Auth Errors ---
  // [1100 - 1109] General Auth Errors
  InvalidDomain = 1100,
  AuthInvalidOtp = 1101,
  InvalidToken = 1102,
  MissingToken = 1103,
  Unauthorized = 1104,
  CaptchaConnection = 1105,
  VerifyCaptcha = 1106,
  MissingCaptcha = 1107,
  // [1110 - 1119] SPCP Errors
  CreateRedirectUrl = 1110,
  VerifyJwt = 1111,
  MissingAttributes = 1112,
  InvalidJwt = 1113,
  MissingJwt = 1114,
  InvalidIdToken = 1115,
  InvalidState = 1116,
  CreateJwt = 1117,
  ExchangeAuthToken = 1118,
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
  // [1120 - 1139] MyInfo Errors
  MyInfoCircuitBreaker = 1120,
  MyInfoFetch = 1121,
  MyInfoHashing = 1122,
  MyInfoMissingHash = 1123,
  MyInfoHashDidNotMatch = 1124,
  MyinfoParseRelayState = 1125,
  MyInfoMissingLoginCookie = 1126,
  MyInfoInvalidLoginCookie = 1127,
  MyInfoInvalidAuthCodeCookie = 1128,
  MyInfoCookieState = 1129,
  // [1140 - 1149] SgID Errors
  SgidCreateRedirectUrl = 1140,
  SgidInvalidState = 1141,
  SgidFetchAccessToken = 1142,
  SgidFetchUserInfo = 1143,
  SgidMalformedMyInfoCookie = 1144,
  SgidVerifyJwt = 1145,
  SgidInvalidJwt = 1146,
  SgidMissingJwt = 1147,
  // End of Auth Errors ---

  // [12xx] Database Errors ---
  DatabaseError = 1200,
  DatabaseValidation = 1201,
  DatabaseConflict = 1202,
  DatabasePayloadSize = 1203,
  DatabaseDuplicateKey = 1204,
  DatabaseWriteConflict = 1205,
  SecretsManager = 1206,
  SecretsManagerNotFound = 1207,
  SecretsManagerConflict = 1208,
  // End of Database Errors ---

  // [13xx] Payment Errors ---
  // [1300 - 1309] General Payment Errors
  InvalidPaymentAmount = 1300,
  PaymentNotFound = 1301,
  ConfirmedPaymentNotFound = 1302,
  PaymentAlreadyConfirmed = 1303,
  PaymentAccountInformation = 1304,
  InvalidPaymentProducts = 1305,
  PaymentConfiguration = 1306,
  // [1310 - 1329] Stripe Errors
  SuccessfulChargeNotFound = 1310,
  StripeTransactionFeeNotFound = 1311,
  MalformedStripeChargeObject = 1312,
  MalformedStripeEventObject = 1313,
  StripeMetadataInvalid = 1314,
  StripeMetadataValidPaymentIdNotFound = 1315,
  StripeMetadataIncorrectEnv = 1316,
  StripeFetch = 1317,
  StripeAccount = 1318,
  ComputePaymentState = 1319,
  // [1330 - 1339] Billing Errors
  FormHasNoAuth = 1330,
  // [1340 - 1349] Payment Proof Errors
  InvoicePdfGeneration = 1340,
  PaymentProofUploadS3 = 1341,
  PaymentProofPresignS3 = 1342,
  // End of Payment Errors ---

  // [14xx] Communication Channel Errors (SMS, Email, Webhook) ---
  // [1400 - 1419] SMS Errors
  TwilioCache = 1400,
  SmsSend = 1401,
  InvalidNumber = 1402,
  SmsLimitExceeded = 1403,
  UserInvalidOtp = 1404,
  // [1420 - 1439] Mail Errors
  MailSend = 1420,
  MailGeneration = 1421,
  // [1440 - 1459] Webhook Errors
  WebhookValidation = 1440,
  WebhookFailedWithPresignedUrlGeneration = 1441,
  WebhookFailedWithUnknown = 1442,
  WebhookFailedWithAxios = 1443,
  WebhookQueueMessageParsing = 1444,
  WebhookNoMoreRetries = 1445,
  WebhookPushToQueue = 1446,
  WebhookRetriesNotEnabled = 1447,
  // [1460 - 1469] Bounce Errors
  InvalidNotification = 1460,
  SendBounceSmsNotification = 1461,
  MissingEmailHeaders = 1462,
  ParseNotification = 1463,
  // End of Communication Channel Errors ---

  // [15xx] Verification Errors
  TransactionNotFound = 1500,
  FieldNotFoundInTransaction = 1501,
  TransactionExpired = 1502,
  OtpExpired = 1503,
  MissingHashData = 1504,
  OtpRetryExceeded = 1505,
  WrongOtp = 1506,
  WaitForOtp = 1507,
  OtpRequestCountExceeded = 1508,
  NonVerifiedFieldType = 1509,
  OtpRequestError = 1510,
  // End of Verification Errors ---

  // [19xx] Other Errors ---
  // [1900 - 1909] Core Errors
  MalformedParameters = 1900,
  AttachmentUpload = 1901,
  EmptyErrorField = 1902,
  // [1910 - 1919] User Errors
  MissingUser = 1910,
  // [1920 - 1929] Turnstile Errors
  TurnstileConnection = 1920,
  VerifyTurnstile = 1921,
  MissingTurnstile = 1922,
  // [1930 - 1939] Verified Content Errors
  MalformedVerifiedContent = 1930,
  EncryptVerifiedContent = 1931,
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
