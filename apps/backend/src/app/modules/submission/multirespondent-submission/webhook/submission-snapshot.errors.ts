import { ApplicationError, ErrorCodes } from '../../../core/core.errors'

export class SnapshotWriteError extends ApplicationError {
  constructor(
    message = 'Failed to save submission. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_WRITE)
  }
}

/**
 * Raised whenever the snapshot store could not be reached for a reason a later
 * attempt could plausibly get past: throttling, a 5xx, a request timeout or a
 * networking failure.
 */
export class SnapshotReadError extends ApplicationError {
  constructor(
    message = 'Failed to read submission snapshot. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_READ)
  }
}

/**
 * Raised whenever the snapshot store refuses the read. Retrying never fixes
 * this, and filing it as a data-integrity failure would send someone hunting
 * for corrupt objects when the answer is an IAM policy — so it carries its own
 * code.
 */
export class SnapshotAccessDeniedError extends ApplicationError {
  constructor(
    message = 'Access to the submission snapshot store was denied',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_ACCESS_DENIED)
  }
}

/**
 * Raised whenever a retry names a wire shape for which the step submission
 * recorded no snapshot. Produce and deliver disagreed: operationally routine,
 * and deliberately not the data-integrity code, which means the stored object
 * itself is missing or corrupt.
 */
export class SnapshotFormatNotRecordedError extends ApplicationError {
  constructor(
    message = 'No submission snapshot was recorded for the requested content format',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_FORMAT_NOT_RECORDED)
  }
}

/**
 * Raised whenever a submission snapshot is missing, malformed, or otherwise
 * fails to parse.
 */
export class SnapshotDataIntegrityError extends ApplicationError {
  constructor(
    message = 'Submission snapshot is missing or malformed',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_DATA_INTEGRITY)
  }
}
