import { ApplicationError, ErrorCodes } from '../../core/core.errors'

/**
 * v5 configuration is missing or malformed — typically a startup-time issue
 * (no JWKS, no issuer URL). Surfacing as a per-request error so a single
 * mis-configured form doesn't take the process down.
 */
export class MyInfoV5ConfigError extends ApplicationError {
  constructor(message = 'MyInfo v5 is not configured') {
    super(message, undefined, ErrorCodes.MYINFO_FETCH)
  }
}

/**
 * Failure during the OIDC token exchange or userinfo fetch.
 */
export class MyInfoV5TokenError extends ApplicationError {
  constructor(message = 'MyInfo v5 token exchange failed') {
    super(message, undefined, ErrorCodes.MYINFO_FETCH)
  }
}

export class MyInfoV5UserinfoError extends ApplicationError {
  constructor(message = 'MyInfo v5 userinfo fetch failed') {
    super(message, undefined, ErrorCodes.MYINFO_FETCH)
  }
}

/**
 * PKCE verifier cookie was missing or could not be matched against the state
 * returned by Singpass.
 */
export class MyInfoV5PkceError extends ApplicationError {
  constructor(message = 'MyInfo v5 PKCE verifier missing or invalid') {
    super(message, undefined, ErrorCodes.MYINFO_PARSE_RELAY_STATE)
  }
}
