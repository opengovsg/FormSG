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
 * Raised whenever the snapshot store refuses the read.
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
 * Raised whenever a retry names a content format shape for which the step submission
 * recorded no snapshot.
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

/**
 * Raised whenever a V1 delivery has no snapshot object to reconstruct from.
 *
 * This has its own code rather than reusing `SnapshotFormatNotRecordedError`
 * on purpose: that error is raised both for a legitimately absent token and
 * for the legacy retry path, so an alert on it could not tell a hard V1
 * failure apart from normal operation. A V1 delivery has no permitted
 * fallback — the row is never a valid V1 payload — so this is a hard failure
 * and should be visible as one.
 */
export class V1SnapshotUnavailableError extends ApplicationError {
  constructor(
    message = 'No V1 submission snapshot is available for this delivery',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_V1_SNAPSHOT_UNAVAILABLE)
  }
}

/**
 * Raised whenever the storage-shaped V1 copy could not be produced from the
 * respondent's plaintext at submit time — an unsupported field type in the
 * flatten, or a malformed response the shared validation rejects.
 *
 * It surfaces as its own error rather than an exception so that the copy's
 * absence rejects the submission with a real status and message, exactly as a
 * snapshot-write failure does. A V1 copy can only be made while the plaintext
 * is in hand, so continuing without one would commit a submission that can
 * never be delivered.
 */
export class V1ContentProductionError extends ApplicationError {
  constructor(
    message = 'Failed to save submission. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_V1_CONTENT_PRODUCTION)
  }
}
