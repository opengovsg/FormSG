import { z } from 'zod'

import { ApplicationError } from '../../../core/core.errors'

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
 * Stable error-code string for the fail-loud data-integrity error. A Datadog
 * monitor keys on this exact string, so it must NOT change.
 */
export const SNAPSHOT_DATA_INTEGRITY_ERROR_CODE =
  'MRF_WEBHOOK_SNAPSHOT_DATA_INTEGRITY'

/**
 * Raised whenever a submission snapshot is missing, malformed, or otherwise
 * fails to parse. Deliberately opaque: any parse failure surfaces the SAME
 * stable code so the monitor can alert on a single signal.
 *
 * NOTE: ApplicationError's third constructor arg is a numeric error code used
 * for the global registry / Datadog error-count metric. The stable string code
 * lives on `dataIntegrityCode` (and in the message) so it is queryable without
 * colliding with the numeric registry.
 */
export class SnapshotDataIntegrityError extends ApplicationError {
  readonly dataIntegrityCode = SNAPSHOT_DATA_INTEGRITY_ERROR_CODE

  constructor(
    message = 'Submission snapshot is missing or malformed',
    meta?: unknown,
  ) {
    super(`[${SNAPSHOT_DATA_INTEGRITY_ERROR_CODE}] ${message}`, meta)
  }
}

/**
 * The ONLY way anything turns bytes into a snapshot. Fail-loud: any failure
 * (malformed JSON, unknown `_v`, wrong shape) throws SnapshotDataIntegrityError.
 * Never returns a partial or invalid object.
 */
export function parseSnapshot(raw: unknown): SubmissionSnapshot {
  let candidate: unknown = raw
  if (typeof raw === 'string') {
    try {
      candidate = JSON.parse(raw)
    } catch (error) {
      // Fail-loud by contract: parseSnapshot is the single trust boundary that
      // turns bytes into a snapshot, so any failure MUST throw the stable
      // data-integrity error rather than return a partial/invalid object.
      // eslint-disable-next-line typesafe/no-throw-sync-func
      throw new SnapshotDataIntegrityError(
        'Snapshot body is not valid JSON',
        error,
      )
    }
  }

  const result = SubmissionSnapshot.safeParse(candidate)
  if (!result.success) {
    // Fail-loud by contract (see above): unknown `_v`, wrong shape, or any
    // other schema violation surfaces the SAME stable error.
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new SnapshotDataIntegrityError(
      'Snapshot failed schema validation',
      result.error.issues,
    )
  }
  return result.data
}
