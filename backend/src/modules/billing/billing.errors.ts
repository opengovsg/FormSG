import { ApplicationError } from '../core/core.errors'

/**
 * Attempt to add Login record for form without authentication enabled.
 */
export class FormHasNoAuthError extends ApplicationError {
  constructor(
    message = 'Attempted to add Login record for form with no authentication',
  ) {
    super(message)
  }
}
