import { SubmissionSnapshotV4 } from './submission-snapshot.schema'

export const buildV4Snapshot = (input: {
  formId: string
  submissionId: string
  submissionIndex: number
  workflowStep: number
  encryptedContent: string
  encryptedSubmissionSecretKey: string
  verifiedContent?: string
  attachmentMetadata?: Record<string, string>
  createdAt: string
}): SubmissionSnapshotV4 => {
  const snapshot: SubmissionSnapshotV4 = {
    _v: 1,
    contentFormat: 'v4',
    formId: input.formId,
    submissionId: input.submissionId,
    submissionIndex: input.submissionIndex,
    workflowStep: input.workflowStep,
    encryptedContent: input.encryptedContent,
    encryptedSubmissionSecretKey: input.encryptedSubmissionSecretKey,
    createdAt: input.createdAt,
  }

  if (input.verifiedContent !== undefined) {
    snapshot.verifiedContent = input.verifiedContent
  }
  if (input.attachmentMetadata !== undefined) {
    snapshot.attachmentMetadata = input.attachmentMetadata
  }

  return snapshot
}
