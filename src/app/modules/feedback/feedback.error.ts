import { ApplicationError } from '../core/core.errors'

export class InvalidSubmissionIdError extends ApplicationError {
  constructor(
    message = 'Feedback submissionId can not be found in the form submissions',
  ) {
    super(message)
  }
}

export class DuplicateFeedbackSubmissionError extends ApplicationError {
  constructor(
    message = 'A feedback with the same formId and submissionId already exists',
  ) {
    super(message)
  }
}
