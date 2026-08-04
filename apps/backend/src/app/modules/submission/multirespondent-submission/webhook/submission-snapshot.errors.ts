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
 * Raised whenever the snapshot store could not be reached, e.g. access denied,
 * throttling or a transient network failure.
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
