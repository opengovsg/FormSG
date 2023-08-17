import { ApplicationError } from '../../core/core.errors'

export class FormDefinitionNotRetrievedError extends ApplicationError {
  constructor(
    message = 'Form definition is not found in request body. Please use retrieveForm middleware before this step.',
  ) {
    super(message)
  }
}

export class FormMissingPublicKeyError extends ApplicationError {
  constructor(
    message = 'Public key is not found in form definition. Please ensure that the form is a storage mode form.',
  ) {
    super(message)
  }
}

export class EncryptedFormDefinitionNotRetrievedError extends ApplicationError {
  constructor(
    message = 'Encrypted form definition is not found in request body. Please use checkEncryptMode middleware before this step.',
  ) {
    super(message)
  }
}

export class EncryptedPayloadNotFoundError extends ApplicationError {
  constructor(
    message = 'Encrypted payload is not found in request body. Please use encryptSubmission middleware before this step.',
  ) {
    super(message)
  }
}

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
