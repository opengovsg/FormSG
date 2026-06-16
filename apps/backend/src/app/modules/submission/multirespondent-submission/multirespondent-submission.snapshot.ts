import mongoose from 'mongoose'

import formsgSdk from 'src/app/config/formsg-sdk'
import getSubmissionHistoryModel from 'src/app/models/submission_history.server.model'

import { IMultirespondentSubmissionSchema } from '../../../../types'
import {
  ContentFormat,
  FormKeyContentCopy,
} from '../../../../types/submission_history'

/**
 * Produces the form-key copy of a step submission's content (M5). Encrypts the
 * plaintext directly to the form public key using the storage-mode mechanism,
 * so a consumer reads it with the form secret key. The `contentFormat` records
 * the shape of the plaintext ('v4' native answer objects for a privileged
 * consumer, 'v1' classic FormField[] otherwise); the webhook protocol version
 * is derived from it at send time, never stored.
 *
 * @param content the step content plaintext to copy
 * @param formPublicKey base-64 form public key to encrypt to
 * @param contentFormat shape of `content`
 */
export const produceFormKeyContentCopy = ({
  content,
  formPublicKey,
  contentFormat,
}: {
  content: unknown
  formPublicKey: string
  contentFormat: ContentFormat
}): FormKeyContentCopy => {
  const encryptedContent = formsgSdk.crypto.encrypt(content, formPublicKey)
  return { encryptedContent, contentFormat }
}

/**
 * Persists a step submission and its submission_history snapshot atomically
 * (ADR-0002): both the step `save()` and the snapshot insert commit in one
 * Mongo transaction, so a failed step writes no snapshot, and the snapshot is
 * durable before the webhook is enqueued (the caller enqueues only after this
 * resolves).
 *
 * When `formKeyContentCopy` is absent (V3 / no webhook / retries off) this is a
 * plain `save()` with no snapshot and no transaction — today's behaviour.
 *
 * The snapshot's `submissionIndex` is the zero-based position of the just-saved
 * step (= last index of the append-only `submittedSteps`).
 */
type HydratedMrfSubmission = IMultirespondentSubmissionSchema & {
  _id: mongoose.Types.ObjectId
}

export const saveStepWithSnapshot = async (
  submission: HydratedMrfSubmission,
  formKeyContentCopy?: FormKeyContentCopy,
): Promise<HydratedMrfSubmission> => {
  if (!formKeyContentCopy) {
    return submission.save()
  }

  const SubmissionHistory = getSubmissionHistoryModel(mongoose)
  const session = await mongoose.startSession()
  try {
    let saved: HydratedMrfSubmission = submission
    await session.withTransaction(async () => {
      saved = await submission.save({ session })
      await SubmissionHistory.insertSnapshot(
        buildSnapshot(submission, formKeyContentCopy),
        { session },
      )
    })
    return saved
  } finally {
    await session.endSession()
  }
}

const buildSnapshot = (
  submission: IMultirespondentSubmissionSchema,
  formKeyContentCopy: FormKeyContentCopy,
) => ({
  submissionId: submission._id,
  formId: submission.form,
  // Zero-based position of this step in the order submitted.
  submissionIndex: (submission.submittedSteps?.length ?? 1) - 1,
  workflowStep: submission.workflowStep,
  encryptedContent: formKeyContentCopy.encryptedContent,
  contentFormat: formKeyContentCopy.contentFormat,
})
