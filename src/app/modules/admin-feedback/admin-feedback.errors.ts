import { ApplicationError } from '../core/core.errors'

export class MissingAdminFeedbackError extends ApplicationError {
  constructor(message = 'Admin feedback not found') {
    super(message)
  }
}

export class IncorrectUserIdToAdminFeedbackError extends ApplicationError {
  constructor(message = 'Admin feedback does not belong to user') {
    super(message)
  }
}
