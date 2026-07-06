import { ApplicationError, ErrorCodes } from '../../core/core.errors'

/**
 * Failed to persist a submission history snapshot to the backing store.
 * On the submission write path this aborts the submission (S3-first ordering),
 * so no orphaned live row is left without its snapshot.
 */
export class SubmissionHistoryUploadError extends ApplicationError {
  constructor(message = 'Failed to upload submission history snapshot') {
    super(message, undefined, ErrorCodes.SUBMISSION_HISTORY_UPLOAD)
  }
}

/**
 * A snapshot expected to exist could not be found in the backing store.
 * Fail-loud: the caller must surface/alarm rather than fall back to the
 * (mutated) live row.
 */
export class SubmissionHistoryNotFoundError extends ApplicationError {
  constructor(message = 'Submission history snapshot not found') {
    super(message, undefined, ErrorCodes.SUBMISSION_HISTORY_NOT_FOUND)
  }
}

/**
 * A snapshot was found but could not be parsed/validated against the
 * envelope schema.
 */
export class SubmissionHistoryMalformedError extends ApplicationError {
  constructor(message = 'Submission history snapshot is malformed') {
    super(message, undefined, ErrorCodes.SUBMISSION_HISTORY_MALFORMED)
  }
}
