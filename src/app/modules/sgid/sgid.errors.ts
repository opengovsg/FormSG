import { ApplicationError, ErrorCodes } from '../../modules/core/core.errors'

export class SgidCreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message, undefined, ErrorCodes.SgidCreateRedirectUrl)
  }
}

export class SgidInvalidStateError extends ApplicationError {
  constructor(message = 'State given by sgID is malformed') {
    super(message, undefined, ErrorCodes.SgidInvalidState)
  }
}

export class SgidFetchAccessTokenError extends ApplicationError {
  constructor(message = 'Error while fetching access token') {
    super(message, undefined, ErrorCodes.SgidFetchAccessToken)
  }
}

export class SgidFetchUserInfoError extends ApplicationError {
  constructor(message = 'Error while fetching user info') {
    super(message, undefined, ErrorCodes.SgidFetchUserInfo)
  }
}

export class SgidMalformedMyInfoCookieError extends ApplicationError {
  constructor(message = 'SGID MyInfo cookie is malformed') {
    super(message, undefined, ErrorCodes.SgidMalformedMyInfoCookie)
  }
}

/**
 * JWT could not be decoded.
 */
export class SgidVerifyJwtError extends ApplicationError {
  constructor(message = 'Invalid JWT') {
    super(message, undefined, ErrorCodes.SgidVerifyJwt)
  }
}

/**
 * JWT could be decoded but has the wrong shape
 */
export class SgidInvalidJwtError extends ApplicationError {
  constructor(message = 'Decoded JWT did not contain the correct attributes') {
    super(message, undefined, ErrorCodes.SgidInvalidJwt)
  }
}

/**
 * JWT not present in cookies
 */
export class SgidMissingJwtError extends ApplicationError {
  constructor(message = 'No JWT present in cookies') {
    super(message, undefined, ErrorCodes.SgidMissingJwt)
  }
}
