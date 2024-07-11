import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class InvalidSubmissionIdError extends ApplicationError {
  constructor(message = 'Sorry, something went wrong. Please try again.') {
    super(message, undefined, ErrorCodes.FEEDBACK_INVALID_SUBMISSION_ID)
  }
}

export class DuplicateFeedbackSubmissionError extends ApplicationError {
  constructor(
    message = 'You have already submitted feedback for this submission. To provide additional feedback, please contact the form administrator.',
  ) {
    super(message, undefined, ErrorCodes.FEEDBACK_DUPLICATE_SUBMISSION)
  }
}
