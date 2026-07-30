import { err, ok, Result } from 'neverthrow'
import { z } from 'zod'

import { SnapshotDataIntegrityError } from './submission-snapshot.errors'

/**
 * Snapshot schema — zod is the single source of truth for the on-disk shape of
 * an MRF v4 submission snapshot. TypeScript types are inferred from it so the
 * schema and the types can never drift apart.
 */
const SnapshotBase = z.object({
  _v: z.literal(1),
  formId: z.string(),
  submissionId: z.string(),
  submissionIndex: z.number().int(),
  workflowStep: z.number().int(),
  encryptedContent: z.string(),
  verifiedContent: z.string().optional(),
  attachmentMetadata: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().datetime(),
})

const SnapshotV4 = SnapshotBase.extend({
  contentFormat: z.literal('v4'),
  encryptedContent: z.string(),
  encryptedSubmissionSecretKey: z.string(),
})

const SnapshotV1 = SnapshotBase.extend({
  contentFormat: z.literal('v1'),
  encryptedContent: z.string(),
})

export const SubmissionSnapshot = z.discriminatedUnion('contentFormat', [
  SnapshotV4,
  SnapshotV1,
])
export type SubmissionSnapshot = z.infer<typeof SubmissionSnapshot>
export type SubmissionSnapshotV4 = z.infer<typeof SnapshotV4>

/**
 * The ONLY way anything turns bytes into a snapshot. Fail-loud: any failure
 * (malformed JSON, unknown `_v`, wrong shape) resolves to a
 * SnapshotDataIntegrityError. Never returns a partial or invalid object.
 */
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
