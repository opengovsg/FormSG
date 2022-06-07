import { ApplicationError } from '../core/core.errors'

export class InvalidSubmissionIdError extends ApplicationError {
  constructor(
    message = 'Feedback submissionId can not be found in the form submissions. Please submit a form before you submit a feedback.',
  ) {
    super(message)
  }
}

export class DuplicateFeedbackSubmissionError extends ApplicationError {
  constructor(
    message = 'You have already submitted feedback for this submission. To provide additional feedback, please contact the form administrator.',
  ) {
    super(message)
  }
}
