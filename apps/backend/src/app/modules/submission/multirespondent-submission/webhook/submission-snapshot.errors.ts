import { ApplicationError, ErrorCodes } from '../../../core/core.errors'

/**
 * Raised when a snapshot cannot be durably written — either S3 rejected the
 * PUT for a non-collision reason, or the bounded create-if-absent retry loop
 * exhausted its attempts. NEVER raised by silently overwriting: `IfNoneMatch`
 * is on every attempt, so an existing object is never clobbered.
 */
export class SnapshotWriteError extends ApplicationError {
  constructor(
    message = 'Failed to save submission. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_WRITE)
  }
}

/**
 * Raised whenever a submission snapshot is missing, malformed, or otherwise
 * fails to parse. Deliberately opaque: any parse failure surfaces the SAME
 * error code so alerts fire on a single signal.
 */
export class SnapshotDataIntegrityError extends ApplicationError {
  constructor(
    message = 'Submission snapshot is missing or malformed',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_DATA_INTEGRITY)
  }
}
