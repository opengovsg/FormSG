import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class MyInfoFapiConfigError extends ApplicationError {
  constructor(message = 'MyInfo FAPI client could not be initialised') {
    super(message, undefined, ErrorCodes.MYINFO_FAPI_CONFIG)
  }
}

/** The callback was reached and the login did not succeed. */
export class MyInfoFapiLoginFailedError extends ApplicationError {
  constructor(message = 'MyInfo FAPI login did not succeed') {
    super(message, undefined, ErrorCodes.MYINFO_FAPI_LOGIN_FAILED)
  }
}

export class MyInfoFapiIncompleteLoginError extends ApplicationError {
  constructor(message = 'MyInfo FAPI login not completed') {
    super(message, undefined, ErrorCodes.MYINFO_FAPI_INCOMPLETE_LOGIN)
  }
}

export class MyInfoFapiSessionFormMismatchError extends ApplicationError {
  constructor(message = 'MyInfo FAPI login session belongs to another form') {
    super(message, undefined, ErrorCodes.MYINFO_FAPI_SESSION_FORM_MISMATCH)
  }
}

export class MyInfoFapiAuthRequestError extends ApplicationError {
  constructor(
    message = 'Error while creating MyInfo FAPI authorization request',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.MYINFO_FAPI_AUTH_REQUEST)
  }
}

export class MyInfoFapiExchangeError extends ApplicationError {
  constructor(
    message = 'Error while exchanging MyInfo FAPI authorization code',
  ) {
    super(message, undefined, ErrorCodes.MYINFO_FAPI_EXCHANGE)
  }
}

export class MyInfoFapiFetchError extends ApplicationError {
  constructor(message = 'Error while requesting MyInfo FAPI userinfo') {
    super(message, undefined, ErrorCodes.MYINFO_FAPI_FETCH)
  }
}

export class MyInfoFapiMissingUinFinError extends ApplicationError {
  constructor(message = 'MyInfo FAPI userinfo did not contain a uinfin') {
    super(message, undefined, ErrorCodes.MYINFO_FAPI_MISSING_UINFIN)
  }
}
