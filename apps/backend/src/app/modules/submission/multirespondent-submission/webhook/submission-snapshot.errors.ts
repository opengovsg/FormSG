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
 * Raised whenever a V1 delivery has no usable V1 snapshot to reconstruct from
 * (missing, wrong format, or this delivery is not allowed to use one). Distinct
 * from `SnapshotFormatNotRecordedError`: a V1 delivery has no fallback — the
 * encrypted submission row is in V4 and cannot be used to reconstruct a V1 payload.
 */
export class V1SnapshotRequiredError extends ApplicationError {
  constructor(
    message = 'No usable V1 snapshot for this delivery',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_V1_SNAPSHOT_REQUIRED)
  }
}

/**
 * Raised whenever the V4 responses cannot be mapped into a storage-shaped V1
 * copy at submit time: an unsupported field type in the flatten, a malformed
 * response the shared validation rejects, or the subsequent encrypt failing.
 */
export class V1ContentMappingError extends ApplicationError {
  constructor(
    message = 'Failed to save submission. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_V1_CONTENT_MAPPING)
  }
}
