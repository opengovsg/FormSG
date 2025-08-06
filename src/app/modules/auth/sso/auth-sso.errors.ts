import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class SsoCreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message, undefined, ErrorCodes.SSO_CREATE_REDIRECT_URL)
  }
}
export class SsoDiscoveryError extends ApplicationError {
  constructor(message = 'Error while discovering SSO configuration') {
    super(message, undefined, ErrorCodes.SSO_DISCOVERY)
  }
}

export class SsoNotWhitelistedError extends ApplicationError {
  constructor(message = 'User is not whitelisted for SSO login') {
    super(message, undefined, ErrorCodes.SSO_NOT_WHITELISTED)
  }
}
