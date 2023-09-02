import { ApplicationError } from '../../core/core.errors'

export class FormsgReqBodyExistsError extends ApplicationError {
  constructor(
    message = 'The formsg key already exists in request. Please check that you are not overwriting it.',
  ) {
    super(message)
  }
}

export class EncryptedPayloadExistsError extends ApplicationError {
  constructor(
    message = 'Encrypted payload already exists in req.formsg. Please check that you are not overwriting it.',
  ) {
    super(message)
  }
}

export class SubmissionFailedError extends ApplicationError {
  constructor(
    message = 'The form submission could not be processed. Please try again.',
  ) {
    super(message)
  }
}

export class CreatePresignedPostError extends ApplicationError {
  constructor(
    message = 'Could not create presigned post data. Please try again.',
  ) {
    super(message)
  }
}

export class InvalidFieldIdError extends ApplicationError {
  constructor(
    message = 'Invalid field id. Field id should be a valid MongoDB ObjectId.',
  ) {
    super(message)
  }
}
