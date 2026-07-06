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
   * Persist a snapshot to a unique, per-attempt object and return its
   * provider-opaque `snapshotToken`. Write-once: the token identifies exactly
   * the object written by this call (never overwritten). The caller records the
   * token on the winning row so the reader resolves this exact object.
   */
  saveSnapshot(
    snapshot: SubmissionHistorySnapshot,
    format: SnapshotFormat,
  ): ResultAsync<{ snapshotToken: string }, SubmissionHistoryUploadError>

  /**
   * Fetch and validate the snapshot the locator's token names. Fail-loud: a
   * missing object yields `SubmissionHistoryNotFoundError`; an unparseable/invalid
   * object yields `SubmissionHistoryMalformedError`.
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
