import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class OneCreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message, undefined, ErrorCodes.ONE_CREATE_REDIRECT_URL)
  }
}

export class OneDiscoveryError extends ApplicationError {
  constructor(message = 'Error while discovering one.gov.sg configuration') {
    super(message, undefined, ErrorCodes.ONE_DISCOVERY)
  }
}

export class OneNotWhitelistedError extends ApplicationError {
  constructor(message = 'User is not whitelisted for one.gov.sg login') {
    super(message, undefined, ErrorCodes.ONE_NOT_WHITELISTED)
  }
}
