import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class SgidCreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message, undefined, ErrorCodes.SGID_CREATE_REDIRECT_URL)
  }
}

export class SgidFetchAccessTokenError extends ApplicationError {
  constructor(message = 'Error while fetching access token') {
    super(message, undefined, ErrorCodes.SGID_FETCH_ACCESS_TOKEN)
  }
}

export class SgidFetchUserInfoError extends ApplicationError {
  constructor(message = 'Error while fetching user info') {
    super(message, undefined, ErrorCodes.SGID_FETCH_USER_INFO)
  }
}
