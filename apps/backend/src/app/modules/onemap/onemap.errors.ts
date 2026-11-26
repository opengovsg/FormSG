import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class OneMapRequestError extends ApplicationError {
  constructor(message = 'OneMap request failed') {
    super(message, undefined, ErrorCodes.ONEMAP_REQUEST_FAILURE)
  }
}
