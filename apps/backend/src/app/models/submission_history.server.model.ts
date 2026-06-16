import { ClientSession, Connection, Mongoose, Schema } from 'mongoose'

import {
  ISubmissionHistoryModel,
  ISubmissionHistorySchema,
  SubmissionHistorySnapshot,
} from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'
import { SUBMISSION_SCHEMA_ID } from './submission.server.model'

export const SUBMISSION_HISTORY_SCHEMA_ID = 'SubmissionHistory'

/**
 * An append-only collection of per-step submission snapshots. One immutable
 * document per MRF step submission, holding only the irreproducible per-step
 * bits (the form-key content copy + optional verified content / attachment
 * metadata). Everything stable or reconstructible is read from the live
 * submission row at send time. See ADR-0002.
 *
 * Documents are never updated in place; `createdAt` is the only timestamp.
 */
const SubmissionHistorySchema = new Schema<
  ISubmissionHistorySchema,
  ISubmissionHistoryModel
>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: SUBMISSION_SCHEMA_ID,
      required: true,
    },
    formId: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    submissionIndex: {
      type: Number,
      required: true,
    },
    workflowStep: {
      type: Number,
      required: true,
    },
    encryptedContent: {
      type: String,
      required: true,
    },
    contentFormat: {
      type: String,
      enum: ['v1', 'v4'],
      required: true,
    },
    verifiedContent: {
      type: String,
    },
    attachmentMetadata: {
      type: Map,
      of: String,
    },
  },
  {
    collection: 'submission_history',
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: false,
    },
  },
)

// `submissionIndex` is the snapshot's identity within a submission — strictly
// monotonic, so it stays unique even when a workflow loops back and
// `workflowStep` repeats.
SubmissionHistorySchema.index(
  { submissionId: 1, submissionIndex: 1 },
  { unique: true },
)
// Secondary index for history/audit queries.
SubmissionHistorySchema.index({ formId: 1, createdAt: -1 })

SubmissionHistorySchema.statics.insertSnapshot = async function (
  snapshot: SubmissionHistorySnapshot,
  options?: { session?: ClientSession },
) {
  const [created] = await this.create([snapshot], {
    session: options?.session,
  })
  return created
}

SubmissionHistorySchema.statics.findBySubmissionIdAndIndex = async function (
  submissionId: string,
  submissionIndex: number,
) {
  return this.findOne({ submissionId, submissionIndex }).exec()
}

const getSubmissionHistoryModel = (
  db: Mongoose | Connection,
): ISubmissionHistoryModel => {
  try {
    return db.model(SUBMISSION_HISTORY_SCHEMA_ID) as ISubmissionHistoryModel
  } catch {
    return db.model<ISubmissionHistorySchema, ISubmissionHistoryModel>(
      SUBMISSION_HISTORY_SCHEMA_ID,
      SubmissionHistorySchema,
    )
  }
}

export default getSubmissionHistoryModel
