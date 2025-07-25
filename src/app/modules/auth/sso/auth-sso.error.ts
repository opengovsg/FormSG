import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class SsoCreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message, undefined, ErrorCodes.SSO_CREATE_REDIRECT_URL)
  }
}
