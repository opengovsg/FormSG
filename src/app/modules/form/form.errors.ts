import { ApplicationError } from '../core/core.errors'

export class FormNotFoundError extends ApplicationError {
  constructor(message = 'Form not found') {
    super(message)
  }
}

export class FormDeletedError extends ApplicationError {
  constructor(message = 'Form has been deleted') {
    super(message)
  }
}

/**
 * Distinct from FormNotFoundError, this error should be returned when a form
 * that is to be returned for public consumption when its status is PRIVATE.
 */
export class PrivateFormError extends ApplicationError {
  /**
   * @param message Message used should be the form's inactive message.
   */
  constructor(
    message = 'If you think this is a mistake, please contact the agency that gave you the form link.',
  ) {
    super(message)
  }
}
