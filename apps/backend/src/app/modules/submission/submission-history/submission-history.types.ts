import * as z from 'zod'

/**
 * Envelope schema version. Readers branch on this (object-discovered, never
 * the S3 key) so future shape changes don't require per-field sniffing.
 */
export const SUBMISSION_HISTORY_ENVELOPE_VERSION = 1

/**
 * Snapshot payload format, encoded in the object key.
 * - `v4`: the native MRF (cryptoV3) ciphertext + form-key-wrapped submission
 *   key — what plumber/privileged consumers receive today.
 * - `v1`: storage-mode-compatible form-key-direct ciphertext for generic
 *   consumers. Reserved here; the producer is a later slice (needs the
 *   V4 -> V1 conversion).
 */
export const SNAPSHOT_FORMATS = ['v1', 'v4'] as const
export type SnapshotFormat = (typeof SNAPSHOT_FORMATS)[number]

const objectIdRegex = /^[a-f\d]{24}$/i

/**
 * Per-step immutable snapshot of the submission content that the live MRF row
 * overwrites in place. Stored as JSON; this schema validates reads.
 *
 * `encryptedContent` is the step's V4 ciphertext and `encryptedSubmissionSecretKey`
 * is that step's submission secret key WRAPPED to the form public key (never the
 * plaintext key). Together they are self-contained: a form-secret-key holder can
 * decrypt the step even after a later step has overwritten the live row's key.
 */
export const submissionHistorySnapshotSchema = z.object({
  _v: z.literal(SUBMISSION_HISTORY_ENVELOPE_VERSION),
  // Snapshot payload format. Object-discovered (recorded in the body, no longer
  // a key segment) so a reader can interpret the ciphertext without re-deriving
  // it from the key.
  format: z.enum(SNAPSHOT_FORMATS),
  formId: z.string().regex(objectIdRegex),
  submissionId: z.string().regex(objectIdRegex),
  // Raw integer position in `submittedSteps` (monotonic, disambiguates
  // loop-back workflows); NOT `workflowStep`.
  submissionIndex: z.number().int().nonnegative(),
  workflowStep: z.number().int().nonnegative(),
  encryptedContent: z.string(),
  encryptedSubmissionSecretKey: z.string(),
  verifiedContent: z.string().optional(),
  // Plain object (fieldId -> S3 object key), never a Map.
  attachmentMetadata: z.record(z.string(), z.string()).optional(),
  createdAt: z.string(),
})

export type SubmissionHistorySnapshot = z.infer<
  typeof submissionHistorySnapshotSchema
>

/**
 * Provider-independent address of a snapshot. Each store maps this to its own
 * addressing (the S3 store builds an object key from it).
 *
 * A snapshot object is identified by two independent dimensions:
 * - `format` — the payload variant (`v1`/`v4`); a single step may snapshot both.
 * - `snapshotToken` — a per-attempt nonce minted by the store at write time and
 *   recorded (per format) on the winning `submittedSteps` entry.
 *
 * Together they — not `submissionIndex` alone — are the object's identity, so the
 * reader always resolves to the exact immutable object the committed row names
 * (ADR-0004).
 */
export interface SnapshotLocator {
  formId: string
  submissionId: string
  submissionIndex: number
  format: SnapshotFormat
  snapshotToken: string
}
