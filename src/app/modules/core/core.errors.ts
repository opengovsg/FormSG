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
 * Group in general categories for easy datadog queries
 * Group in sub groups for easy allocation, identification with screaming snake case prefix of the module
 */
export enum ErrorCodes {
  // [10xxxx] FormSG Errors ----------------------------------------------------
  // [100000 - 100099] General Form Errors (/modules/form)
  FORM_PRIVATE_FORM = 100000,
  FORM_NOT_FOUND = 100001,
  FORM_DELETED = 100002,
  FORM_FORBIDDEN_FORM = 100003,
  FORM_TRANSFER_OWNERSHIP = 100004,
  FORM_LOGIC_NOT_FOUND = 100005,
  FORM_AUTH_TYPE_MISMATCH = 100006,
  FORM_AUTH_NO_ESRVC_ID = 100007,
  FORM_RESPONDENT_NOT_WHITELISTED = 100008,
  FORM_RESPONDENT_SINGLE_SUBMISSION_VALIDATION_FAILED = 100009,
  FORM_UNEXPECTED_WHITELIST_SETTING_NOT_FOUND = 100010,
  FORM_INVALID_RESPONSE_MODE = 100011,
  // [100100 - 100199] Admin Form Errors (/modules/form/admin-form)
  ADMIN_FORM_INVALID_FILE_TYPE = 100100,
  ADMIN_FORM_EDIT_FIELD = 100101,
  ADMIN_FORM_FIELD_NOT_FOUND = 100102,
  ADMIN_FORM_INVALID_COLLABORATOR = 100103,
  ADMIN_FORM_PAYMENT_CHANNEL_NOT_FOUND = 100104,
  ADMIN_FORM_GOGOV = 100105,
  ADMIN_FORM_GOGOV_VALIDATION = 100106,
  ADMIN_FORM_GOGOV_ALREADY_EXIST = 100107,
  ADMIN_FORM_GOGOV_REQUEST_LIMIT = 100108,
  ADMIN_FORM_GOGOV_BAD_GATEWAY = 100109,
  ADMIN_FORM_GOGOV_SERVER = 100110,
  ADMIN_FORM_INVALID_APPROVAL_FIELD_TYPE = 100111,
  ADMIN_FORM_MODEL_RESPONSE_INVALID_SYNTAX = 100112,
  ADMIN_FORM_MODEL_RESPONSE_INVALID_SCHEMA_FORMAT = 100113,
  ADMIN_FORM_MODEL_RESPONSE_FAILURE = 100114,
  ADMIN_FORM_MODEL_GET_CLIENT_FAILURE = 100115,
  // [100200 - 100299] Submission Errors (/modules/submission)
  SUBMISSION_CONFLICT = 100200,
  SUBMISSION_NOT_FOUND = 100201,
  SUBMISSION_PENDING_NOT_FOUND = 100202,
  SUBMISSION_INVALID_TYPE = 100203,
  SUBMISSION_INVALID_ENCODING = 100204,
  SUBMISSION_PROCESSING = 100205,
  SUBMISSION_VALIDATE_FIELD = 100206,
  SUBMISSION_VALIDATE_FIELD_V3 = 100702,
  SUBMISSION_SEND_EMAIL_CONFIRMATION = 100207,
  SUBMISSION_WRONG_RESPONSE_MODE = 100208,
  SUBMISSION_ATTACHMENT_TOO_LARGE = 100209,
  SUBMISSION_INVALID_FILE_EXTENSION = 100210,
  SUBMISSION_FAILED = 100211,
  SUBMISSION_INVALID_FIELD_ID = 100212,
  SUBMISSION_ATTACHMENT_SIZE_LIMIT_EXCEEDED = 100213,
  SUBMISSION_FEATURE_DISABLED = 100214,
  SUBMISSION_INVALID_FILE_KEY = 100215,
  SUBMISSION_VIRUS_SCAN_FAILED = 100216,
  SUBMISSION_JSON_PARSE_FAILED = 100217,
  SUBMISSION_DOWNLOAD_CLEAN_FILE_FAILED = 100218,
  SUBMISSION_PARSE_VIRUS_SCANNER_LAMBDA_PAYLOAD = 100219,
  SUBMISSION_MALICIOUS_FILE_DETECTED = 100220,
  SUBMISSION_INVALID_WORKFLOW_TYPE = 100221,
  SUBMISSION_ATTACHMENT_UPLOAD = 100222,
  SUBMISSION_EXPECTED_RESPONSE_NOT_FOUND = 100224,
  SUBMISSION_SAVE_FAILURE = 100225,
  // Email Submission Errors (email mode deprecated soon)
  EMAIL_SUBMISSION_HASH = 100223,
  // [100300 - 100399] Receiver Errors (/modules/submission/receiver)
  RECEIVER_INITIALISE_MULTIPART_RECEIVER = 100301,
  RECEIVER_MULTIPART_CONTENT_LIMIT = 100302,
  RECEIVER_MULTIPART_CONTENT_PARSING = 100303,
  RECEIVER_MULTIPART_ERROR = 100304,
  // [100400 - 100499] Encrypt Submission Errors (/modules/submission/encrypt-submission)
  ENCRYPT_FORMSG_REQ_BODY_EXISTS = 100400,
  ENCRYPT_ENCRYPTED_PAYLOAD_EXISTS = 100401,
  // [100500 - 100599] Feedback Errors (/modules/feedback)
  FEEDBACK_INVALID_SUBMISSION_ID = 100500,
  FEEDBACK_DUPLICATE_SUBMISSION = 100501,
  // [100600 - 100699] Admin Feedback Errors (/modules/admin-feedback)
  ADMIN_FEEDBACK_MISSING = 100600,
  // [100700 - 100799] Workspace Errors (/modules/workspace)
  WORKSPACE_NOT_FOUND = 100700,
  WORKSPACE_FORBIDDEN = 100701,
  // End FormSG Errors ---------------------------------------------------------

  // [11xxxx] Auth Errors ------------------------------------------------------
  // [110000 - 110099] General Auth Errors (/modules/auth)
  AUTH_INVALID_DOMAIN = 110000,
  AUTH_INVALID_OTP = 110001,
  AUTH_INVALID_TOKEN = 110002,
  AUTH_MISSING_TOKEN = 110003,
  AUTH_UNAUTHORIZED = 110004,
  // [110100 - 110199] SPCP Errors (/modules/spcp)
  SPCP_CREATE_REDIRECT_URL = 110100,
  SPCP_VERIFY_JWT = 110101,
  SPCP_MISSING_ATTRIBUTES = 110102,
  SPCP_INVALID_JWT = 110103,
  SPCP_MISSING_JWT = 110104,
  SPCP_INVALID_ID_TOKEN = 110105,
  SPCP_INVALID_STATE = 110106,
  SPCP_CREATE_JWT = 110107,
  SPCP_EXCHANGE_AUTH_TOKEN = 110108,
  // [110200 - 110299] SPCP OIDC Errors (/modules/spcp)
  SPCP_OIDC_CREATE_AUTHORISATION_URL = 110200,
  SPCP_OIDC_CREATE_JWT = 110201,
  SPCP_OIDC_GET_SIGNING_KEY = 110202,
  SPCP_OIDC_GET_DECRYPTION_KEY = 110203,
  SPCP_OIDC_GET_VERIFICATION_KEY = 110204,
  SPCP_OIDC_INVALID_ID_TOKEN = 110205,
  SPCP_OIDC_JWK_SHAPE_INVALID = 110206,
  SPCP_OIDC_MISSING_ID_TOKEN = 110207,
  SPCP_OIDC_INVALID_VERIFICATION_KEY = 110208,
  SPCP_OIDC_EXCHANGE_AUTH_TOKEN = 110209,
  // [110300 - 110399] MyInfo Errors (/modules/myinfo)
  MYINFO_CIRCUIT_BREAKER = 110300,
  MYINFO_FETCH = 110301,
  MYINFO_HASHING = 110302,
  MYINFO_MISSING_HASH = 110303,
  MYINFO_HASH_DID_NOT_MATCH = 110304,
  MYINFO_PARSE_RELAY_STATE = 110305,
  MYINFO_MISSING_LOGIN_COOKIE = 110306,
  MYINFO_INVALID_LOGIN_COOKIE = 110307,
  MYINFO_INVALID_AUTH_CODE_COOKIE = 110308,
  MYINFO_COOKIE_STATE = 110309,
  // [110400 - 110499] Sgid Errors (/modules/sgid)
  SGID_CREATE_REDIRECT_URL = 110400,
  SGID_INVALID_STATE = 110401,
  SGID_FETCH_ACCESS_TOKEN = 110402,
  SGID_FETCH_USER_INFO = 110403,
  SGID_MALFORMED_MYINFO_COOKIE = 110404,
  SGID_VERIFY_JWT = 110405,
  SGID_INVALID_JWT = 110406,
  SGID_MISSING_JWT = 110407,
  // End of Auth Errors --------------------------------------------------------

  // [12xxxx] Database Errors (/modules/core) ----------------------------------
  DATABASE_ERROR = 120000,
  DATABASE_VALIDATION = 120001,
  DATABASE_CONFLICT = 120002,
  DATABASE_PAYLOAD_SIZE = 120003,
  DATABASE_DUPLICATE_KEY = 120004,
  DATABASE_WRITE_CONFLICT = 120005,
  // End of Database Errors ----------------------------------------------------

  // [13xxxx] Payment Errors ---------------------------------------------------
  // [130000 - 130099] General Payment Errors (/modules/payments)
  PAYMENT_INVALID_AMOUNT = 130000,
  PAYMENT_NOT_FOUND = 130001,
  PAYMENT_CONFIRMED_PAYMENT_NOT_FOUND = 130002,
  PAYMENT_ALREADY_CONFIRMED = 130003,
  PAYMENT_ACCOUNT_INFORMATION = 130004,
  PAYMENT_INVALID_PAYMENT_PRODUCTS = 130005,
  PAYMENT_CONFIGURATION = 130006,
  // [130100 - 130199] Stripe Errors (/modules/payments)
  PAYMENT_STRIPE_SUCCESSFUL_CHARGE_NOT_FOUND = 130100,
  PAYMENT_STRIPE_TRANSACTION_FEE_NOT_FOUND = 130101,
  PAYMENT_STRIPE_MALFORMED_CHARGE_OBJECT = 130102,
  PAYMENT_STRIPE_MALFORMED_EVENT_OBJECT = 130103,
  PAYMENT_STRIPE_METADATA_INVALID = 130104,
  PAYMENT_STRIPE_METADATA_VALID_PAYMENT_ID_NOT_FOUND = 130105,
  PAYMENT_STRIPE_METADATA_INCORRECT_ENV = 130106,
  PAYMENT_STRIPE_FETCH_ERROR = 130107,
  PAYMENT_STRIPE_ACCOUNT_ERROR = 130108,
  PAYMENT_STRIPE_COMPUTE_PAYMENT_STATE = 130109,
  // [130200 - 130299] Payment Proof Errors (/modules/payments)
  PAYMENT_PROOF_INVOICE_PDF_GENERATION = 130200,
  PAYMENT_PROOF_UPLOAD_S3 = 130201,
  PAYMENT_PROOF_PRESIGN_S3 = 130202,
  // [130300 - 130399] Billing Errors (/modules/billing)
  BILLING_FORM_HAS_NO_AUTH = 130300,
  // End of Payment Errors -----------------------------------------------------

  // [14xxxx] Communication Channel Errors (SMS, Email, Webhook) ---------------
  // [140000 - 140099] SMS Errors (/services/postman-sms)
  POSTMAN_SMS_SEND = 140000,
  POSTMAN_INVALID_NUMBER = 140001,
  // [140100 - 140199] Mail Errors (/services/mail)
  MAIL_SEND_ERROR = 140100,
  MAIL_GENERATION_ERROR = 140101,
  // [140200 - 140299] Webhook Errors (/modules/webhook)
  WEBHOOK_VALIDATION = 140200,
  WEBHOOK_FAILED_WITH_PRESIGNED_URL_GENERATION = 140201,
  WEBHOOK_FAILED_WITH_UNKNOWN_ERROR = 140202,
  WEBHOOK_FAILED_WITH_AXIOS_ERROR = 140203,
  WEBHOOK_QUEUE_MESSAGE_PARSING_ERROR = 140204,
  WEBHOOK_NO_MORE_RETRIES = 140205,
  WEBHOOK_PUSH_TO_QUEUE = 140206,
  WEBHOOK_RETRIES_NOT_ENABLED = 140207,
  // [140300 - 140399] Bounce Errors (/modules/bounce)
  BOUNCE_INVALID_NOTIFCATION = 140300,
  BOUNCE_SEND_BOUNCE_SMS_NOTIFICATION = 140301,
  BOUNCE_MISSING_EMAIL_HEADERS = 140302,
  BOUNCE_PARSE_NOTIFICATION = 140303,
  // End of Communication Channel Errors ---------------------------------------

  // [15xxxx] Verification Errors ----------------------------------------------
  // [150000 - 150099] General Verification Errors (/modules/verification)
  VERIFICATION_TRANSACTION_NOT_FOUND = 150000,
  VERIFICATION_FIELD_NOT_FOUND_IN_TRANSACTION = 150001,
  VERIFICATION_TRANSACTION_EXPIRED = 150002,
  VERIFICATION_OTP_EXPIRED = 150003,
  VERIFICATION_MISSING_HASH_DATA = 150004,
  VERIFICATION_OTP_RETRY_EXCEEDED = 150005,
  VERIFICATION_WRONG_OTP = 150006,
  VERIFICATION_WAIT_FOR_OTP = 150007,
  VERIFICATION_OTP_REQUEST_COUNT_EXCEEDED = 150008,
  VERIFICATION_NON_VERIFIED_FIELD_TYPE = 150009,
  VERIFICATION_SMS_LIMIT_EXCEEDED = 150010,
  VERIFICATION_OTP_REQUEST_ERROR = 150011,
  // [150100 - 150199] Captcha Errors (/services/captcha)
  CAPTCHA_CONNECTION = 150100,
  CAPTCHA_VERIFY = 150101,
  CAPTCHA_MISSING = 150102,
  // [150200 - 150299] Turnstile Errors (/services/turnstile)
  TURNSTILE_CONNECTION = 150200,
  TURNSTILE_RESPONSE_ERROR = 150201,
  TURNSTILE_MISSING = 150202,
  // End of Verification Errors ------------------------------------------------

  // [19xxxx] Other Errors -----------------------------------------------------
  // [190000 - 190099] Core Errors (/modules/core)
  MALFORMED_PARAMETERS = 190000,
  EMPTY_ERROR_FIELD = 190001,
  SECRETS_MANAGER = 190002,
  SECRETS_MANAGER_NOT_FOUND = 190003,
  SECRETS_MANAGER_CONFLICT = 190004,
  TWILIO_CACHE = 190005,
  // [190100 - 190199] User Errors (/modules/user)
  USER_INVALID_OTP = 190100,
  USER_MISSING = 190101,
  // [190200 - 190299] Verified Content Errors (/modules/verified-content)
  VERIFIED_CONTENT_MALFORMED = 190200,
  VERIFIED_CONTENT_ENCRYPT_FAILURE = 190201,
  // End of Other Errors -------------------------------------------------------
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
    this.message = message || 'Something went wrong. Please try again.'
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
    super(message, undefined, ErrorCodes.DATABASE_ERROR)
  }
}

export class DatabaseValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DATABASE_VALIDATION)
  }
}

export class DatabaseConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DATABASE_CONFLICT)
  }
}

export class DatabasePayloadSizeError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DATABASE_PAYLOAD_SIZE)
  }
}

export class DatabaseDuplicateKeyError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DATABASE_DUPLICATE_KEY)
  }
}

export class DatabaseWriteConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.DATABASE_WRITE_CONFLICT)
  }
}

export class SecretsManagerError extends ApplicationError {
  constructor(message?: string) {
    super(message, undefined, ErrorCodes.SECRETS_MANAGER)
  }
}

export class SecretsManagerNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.SECRETS_MANAGER_NOT_FOUND)
  }
}

export class SecretsManagerConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.SECRETS_MANAGER_CONFLICT)
  }
}

export class TwilioCacheError extends ApplicationError {
  constructor(message?: string) {
    super(message, undefined, ErrorCodes.TWILIO_CACHE)
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
    super(message, meta, ErrorCodes.MALFORMED_PARAMETERS)
  }
}

/**
 * A custom error class returned when a method explicitly returns a list of errors
 * but the list itself is empty.
 */
export class EmptyErrorFieldError extends ApplicationError {
  constructor(message = 'Errors were returned but list is empty.') {
    super(message, undefined, ErrorCodes.EMPTY_ERROR_FIELD)
  }
}
