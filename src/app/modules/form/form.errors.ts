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
  /** Extra meta for form title. */
  formTitle: string

  /**
   * @param message Message used should be the form's inactive message.
   * @param formTitle Extra meta for form title
   */
  constructor(
    message = 'If you think this is a mistake, please contact the agency that gave you the form link.',
    formTitle: string,
  ) {
    super(message)
    this.formTitle = formTitle
  }
}

/**
 * Error to be returned when user does not have authorization to access the
 * form.
 */
export class ForbiddenFormError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

/**
 * Error to be returned when form ownership transfer fails.
 */
export class TransferOwnershipError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

/**
 * Error to be returned when form logic cannot be found
 */
export class LogicNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
