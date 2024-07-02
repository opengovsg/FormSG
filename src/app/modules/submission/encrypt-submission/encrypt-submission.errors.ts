import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class FormsgReqBodyExistsError extends ApplicationError {
  constructor(
    message = 'The formsg key already exists in request. Please check that you are not overwriting it.',
  ) {
    super(message, undefined, ErrorCodes.FormsgReqBodyExists)
  }
}

export class EncryptedPayloadExistsError extends ApplicationError {
  constructor(
    message = 'Encrypted payload already exists in req.formsg. Please check that you are not overwriting it.',
  ) {
    super(message, undefined, ErrorCodes.EncryptedPayloadExists)
  }
}
