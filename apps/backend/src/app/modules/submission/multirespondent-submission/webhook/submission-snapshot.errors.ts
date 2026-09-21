import { ApplicationError, ErrorCodes } from '../../../core/core.errors'

export class SnapshotWriteError extends ApplicationError {
  constructor(
    message = 'Failed to save submission. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_WRITE)
  }
}

export class SnapshotReadError extends ApplicationError {
  constructor(
    message = 'Failed to read submission snapshot. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_READ)
  }
}

export class SnapshotAccessDeniedError extends ApplicationError {
  constructor(
    message = 'Access to the submission snapshot store was denied',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_ACCESS_DENIED)
  }
}

export class SnapshotFormatNotRecordedError extends ApplicationError {
  constructor(
    message = 'No submission snapshot was recorded for the requested content format',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_FORMAT_NOT_RECORDED)
  }
}

export class SnapshotDataIntegrityError extends ApplicationError {
  constructor(
    message = 'Submission snapshot is missing or malformed',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_SNAPSHOT_DATA_INTEGRITY)
  }
}

export class V1SnapshotUnavailableError extends ApplicationError {
  constructor(
    message = 'No V1 submission snapshot is available for this delivery',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_V1_SNAPSHOT_UNAVAILABLE)
  }
}

export class V1ContentProductionError extends ApplicationError {
  constructor(
    message = 'Failed to save submission. Please try again later.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.SUBMISSION_MRF_V1_CONTENT_PRODUCTION)
  }
}
