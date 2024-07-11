import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class MissingAdminFeedbackError extends ApplicationError {
  constructor(message = 'Admin feedback not found') {
    super(message, undefined, ErrorCodes.ADMIN_FEEDBACK_MISSING)
  }
}
