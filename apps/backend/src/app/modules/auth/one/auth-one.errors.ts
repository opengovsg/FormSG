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
