import { ApplicationError } from '../../modules/core/core.errors'

export class GovLoginCreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message)
  }
}

export class GovLoginFetchAccessTokenError extends ApplicationError {
  constructor(message = 'Error while fetching access token') {
    super(message)
  }
}
