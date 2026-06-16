import { Document, Model } from 'mongoose'

import { IFormSchema } from './form'
import { IMultirespondentSubmissionSchema } from './submission'

/**
 * Shape of a submission snapshot's `encryptedContent`:
 * - 'v4' — native answer objects, shipped as-is (no translation)
 * - 'v1' — translated to the classic FormField[] storage-mode shape
 *
 * Storage-only descriptor. The webhook protocol `version` is *derived* from it
 * at send time ('v4' -> 3, 'v1' -> 2.1) and is never persisted here.
 */
export type ContentFormat = 'v1' | 'v4'

/**
 * The form-key copy of a step's content: the content encrypted directly to the
 * form public key (storage-mode style), decryptable with the form secret key —
 * no submission secret key needed to read. Produced at submit time (M5),
 * carried on the encrypted payload, and stored on the snapshot.
 */
export type FormKeyContentCopy = {
  encryptedContent: string
  contentFormat: ContentFormat
}

/**
 * The irreproducible per-step bits of an MRF step submission, persisted as one
 * immutable document in the append-only `submission_history` collection.
 * Everything stable or reconstructible (formId, created, workflow,
 * `submittedSteps` prefix, payment) is read from the live submission row at
 * send time — see ADR-0002.
 */
export interface SubmissionHistorySnapshot {
  submissionId: IMultirespondentSubmissionSchema['_id']
  formId: IFormSchema['_id']
  /**
   * Zero-based position of this step in the order submitted (= index in
   * `submittedSteps`). Strictly monotonic, so it uniquely identifies a
   * snapshot even when a workflow loops back and `workflowStep` repeats.
   */
  submissionIndex: number
  /** Workflow-definition position — contextual value, NOT a key. */
  workflowStep: number
  /** Form-public-key copy of the step content (required). */
  encryptedContent: string
  /** Shape of `encryptedContent` (required). */
  contentFormat: ContentFormat
  /** Form-public-key, signed (only when verified content exists). */
  verifiedContent?: string
  /** Form-public-key attachment S3 keys (only when attachments exist). */
  attachmentMetadata?: Map<string, string>
}

export interface ISubmissionHistorySchema
  extends SubmissionHistorySnapshot, Document {
  submissionId: IMultirespondentSubmissionSchema['_id']
  formId: IFormSchema['_id']
  createdAt: Date
}

export interface ISubmissionHistoryModel extends Model<ISubmissionHistorySchema> {
  /**
   * Appends one immutable snapshot document. Pass a Mongo `session` so the
   * insert commits atomically with the step submission (ADR-0002).
   */
  insertSnapshot(
    snapshot: SubmissionHistorySnapshot,
    options?: { session?: import('mongoose').ClientSession },
  ): Promise<ISubmissionHistorySchema>

  /**
   * Resolves the snapshot for a given step submission by its identity
   * `{ submissionId, submissionIndex }`.
   */
  findBySubmissionIdAndIndex(
    submissionId: string,
    submissionIndex: number,
  ): Promise<ISubmissionHistorySchema | null>
}
