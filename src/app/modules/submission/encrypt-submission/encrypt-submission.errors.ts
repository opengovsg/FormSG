import { ApplicationError } from '../../core/core.errors'

export class FormsgReqBodyExistsError extends ApplicationError {
  constructor(
    message = 'The formsg key already exists in the request body. Please check that you are not overwriting the request body.',
  ) {
    super(message)
  }
}

export class EncryptedPayloadExistsError extends ApplicationError {
  constructor(
    message = 'Encrypted payload already exists in req.body.formsg. Please check that you are not overwriting it.',
  ) {
    super(message)
  }
}
