import { ResultAsync } from 'neverthrow'

import {
  SubmissionHistoryMalformedError,
  SubmissionHistoryNotFoundError,
  SubmissionHistoryUploadError,
} from './submission-history.errors'
import { S3SubmissionHistoryStore } from './submission-history.s3.store'
import {
  SnapshotFormat,
  SnapshotLocator,
  SubmissionHistorySnapshot,
} from './submission-history.types'

/**
 * Provider-agnostic port for the `submission_history` store.
 *
 * The S3 implementation is the only provider today, but everything outside
 * this module depends on this interface (and the `SubmissionHistoryStore`
 * singleton below) rather than on S3 directly — so a different backend
 * (e.g. Mongo/GCS) can be swapped in at `createSubmissionHistoryStore()`
 * with no change to callers.
 */
export interface ISubmissionHistoryStore {
  /**
   * Persist a snapshot. Write-once semantics; callers overwrite by re-writing
   * the same locator (bucket-level versioning preserves prior copies).
   */
  saveSnapshot(
    snapshot: SubmissionHistorySnapshot,
    format: SnapshotFormat,
  ): ResultAsync<true, SubmissionHistoryUploadError>

  /**
   * Fetch and validate a snapshot. Fail-loud: a missing object yields
   * `SubmissionHistoryNotFoundError`; an unparseable/invalid object yields
   * `SubmissionHistoryMalformedError`.
   */
  getSnapshot(
    locator: SnapshotLocator,
  ): ResultAsync<
    SubmissionHistorySnapshot,
    SubmissionHistoryNotFoundError | SubmissionHistoryMalformedError
  >
}

/**
 * Single swap point for the storage provider. Returns the S3 implementation
 * today; change here to migrate providers.
 */
const createSubmissionHistoryStore = (): ISubmissionHistoryStore =>
  new S3SubmissionHistoryStore()

/**
 * Process-wide singleton used by the producer and (future) send-side.
 */
export const SubmissionHistoryStore: ISubmissionHistoryStore =
  createSubmissionHistoryStore()
