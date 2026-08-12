import { err, ok, Result } from 'neverthrow'
import { z } from 'zod'

import { SnapshotDataIntegrityError } from './submission-snapshot.errors'

const SnapshotBase = z.object({
  _v: z.literal(1),
  formId: z.string(),
  submissionId: z.string(),
  submissionIndex: z.number().int().min(0),
  workflowStep: z.number().int().min(0),
  encryptedContent: z.string(),
  verifiedContent: z.string().optional(),
  attachmentMetadata: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().datetime(),
})

const SnapshotV4 = SnapshotBase.extend({
  contentFormat: z.literal('v4'),
  encryptedSubmissionSecretKey: z.string(),
})

const SnapshotV1 = SnapshotBase.extend({
  contentFormat: z.literal('v1'),
})

export const SubmissionSnapshot = z.discriminatedUnion('contentFormat', [
  SnapshotV4,
  SnapshotV1,
])
export type SubmissionSnapshot = z.infer<typeof SubmissionSnapshot>
export type SubmissionSnapshotV4 = z.infer<typeof SnapshotV4>

export function parseSnapshot(
  rawSnapshot: string,
): Result<SubmissionSnapshot, SnapshotDataIntegrityError> {
  let jsonParsedSnapshot: unknown
  try {
    jsonParsedSnapshot = JSON.parse(rawSnapshot)
  } catch (error) {
    return err(
      new SnapshotDataIntegrityError('Snapshot body is not valid JSON', error),
    )
  }

  const result = SubmissionSnapshot.safeParse(jsonParsedSnapshot)
  if (!result.success) {
    return err(
      new SnapshotDataIntegrityError(
        'Snapshot failed schema validation',
        result.error.issues,
      ),
    )
  }
  return ok(result.data)
}
