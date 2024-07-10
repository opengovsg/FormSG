import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class SubmissionHashError extends ApplicationError {
  constructor(message = 'Error occurred while attempting to hash submission') {
    super(message, undefined, ErrorCodes.EMAIL_SUBMISSION_HASH)
  }
}
