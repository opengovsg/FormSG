import {
  FORM_RESPONDENT_NOT_WHITELISTED_ERROR_MESSAGE,
  FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE,
} from '../../../../shared/constants/errors'
import { FormAuthType } from '../../../../shared/types'
import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class FormNotFoundError extends ApplicationError {
  constructor(message = 'Form not found') {
    super(message, undefined, ErrorCodes.FORM_NOT_FOUND)
  }
}

export class FormInvalidResponseModeError extends ApplicationError {
  constructor(message = 'Invalid response mode') {
    super(message, undefined, ErrorCodes.FORM_INVALID_RESPONSE_MODE)
  }
}

export class FormDeletedError extends ApplicationError {
  constructor(message = 'This form is no longer active') {
    super(message, undefined, ErrorCodes.FORM_DELETED)
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
    message = 'If you require further assistance, please contact the agency that gave you the form link.',
    formTitle: string,
  ) {
    super(message, undefined, ErrorCodes.FORM_PRIVATE_FORM)
    this.formTitle = formTitle
  }
}

/**
 * Error to be returned when user does not have authorization to access the
 * form.
 */
export class ForbiddenFormError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.FORM_FORBIDDEN_FORM)
  }
}

/**
 * Error to be returned when form ownership transfer fails.
 */
export class TransferOwnershipError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.FORM_TRANSFER_OWNERSHIP)
  }
}

/**
 * Error to be returned when form logic cannot be found
 */
export class LogicNotFoundError extends ApplicationError {
  constructor(message = 'logicId does not exist on form') {
    super(message, undefined, ErrorCodes.FORM_LOGIC_NOT_FOUND)
  }
}

/**
 * Error to be returned when the form's auth type does not match what is required
 */
export class AuthTypeMismatchError extends ApplicationError {
  constructor(attemptedAuthType: FormAuthType, formAuthType?: FormAuthType) {
    super(
      `Attempted authentication type ${attemptedAuthType} did not match form auth type ${formAuthType}`,
      undefined,
      ErrorCodes.FORM_AUTH_TYPE_MISMATCH,
    )
  }
}

/**
 * Error to be returned when the form has authentication enabled but is lacking an eServiceId
 */

export class FormAuthNoEsrvcIdError extends ApplicationError {
  constructor(formId: string) {
    super(
      `Attempted to validate form ${formId} which did not have an eServiceId`,
      undefined,
      ErrorCodes.FORM_AUTH_NO_ESRVC_ID,
    )
  }
}

export class FormRespondentNotWhitelistedError extends ApplicationError {
  constructor() {
    super(
      FORM_RESPONDENT_NOT_WHITELISTED_ERROR_MESSAGE,
      undefined,
      ErrorCodes.FORM_RESPONDENT_NOT_WHITELISTED,
    )
  }
}

export class FormWhitelistSettingNotFoundError extends ApplicationError {
  constructor(message = 'Whitelist setting not found') {
    super(
      message,
      undefined,
      ErrorCodes.FORM_UNEXPECTED_WHITELIST_SETTING_NOT_FOUND,
    )
  }
}

export class FormRespondentSingleSubmissionValidationError extends ApplicationError {
  constructor() {
    super(
      FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE,
      undefined,
      ErrorCodes.FORM_RESPONDENT_SINGLE_SUBMISSION_VALIDATION_FAILED,
    )
  }
}
