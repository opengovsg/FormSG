/**
 * Compile-time assertions for PIN-04 and PIN-01 of #9972, made visible.
 *
 * Without this file, the answer to "where is the test for those pins?" is
 * "the compiler", which a reviewer cannot see and a future widening of the
 * types would remove silently. An unused `@ts-expect-error` is itself a
 * compile error, so relaxing any of the guarantees below breaks the build
 * instead.
 *
 * It lives in `src/` and not in `__tests__/` deliberately: a spec file would
 * be checked by nothing here. `pnpm build` uses `tsconfig.build.json`, which
 * excludes specs; `test:backend:ci` runs ts-jest with `isolatedModules`, which
 * is transpile-only; `lint-ci` is eslint, and an unused directive is a `tsc`
 * diagnostic rather than a lint rule; and CI has no `tsc --noEmit` step. A
 * file under `src/` is covered by `pnpm build`, and therefore by CI.
 *
 * The cost is a few unreachable lines in `dist`. That is the price of the
 * guard being real.
 */
import { SubmissionSnapshotV1 } from './submission-snapshot.schema'
import { StorageShapedWebhookData } from './v1-payload'
import { reconstructV1WebhookData } from './webhook-reconstruction'

const STORAGE_SHAPED: StorageShapedWebhookData = {
  formId: 'form-1',
  submissionId: 'sub-1',
  encryptedContent: 'form-key-encrypted',
  verifiedContent: undefined,
  version: 2.1,
  created: new Date(0),
  attachmentDownloadUrls: {},
  paymentContent: {},
}

// PIN-04: workflow metadata cannot reach the V1 wire. The row's workflow copy
// carries respondent email addresses unstripped, so this is the guard that
// keeps them off it.
const _withWorkflowContent: StorageShapedWebhookData = {
  ...STORAGE_SHAPED,
  // @ts-expect-error `workflowContent` is not a key of the storage-mode shape
  workflowContent: { workflow: [], workflowStep: 0, submittedSteps: [] },
}

// PIN-04: no wrapped submission secret key. A V1 consumer decrypts with the
// form secret key it already holds and has no use for one.
const _withSubmissionSecretKey: StorageShapedWebhookData = {
  ...STORAGE_SHAPED,
  // @ts-expect-error `encryptedSubmissionSecretKey` is not a key of the shape
  encryptedSubmissionSecretKey: 'wrapped-read-key',
}

// PIN-01: a V1 reconstruction requires a snapshot. The live-row fallback is
// forbidden, and here it is not expressible.
const _v1WithoutSnapshot = () =>
  reconstructV1WebhookData({
    liveData: {
      ...STORAGE_SHAPED,
      verifiedContent: undefined,
    },
    // @ts-expect-error a V1 reconstruction cannot be asked for without a snapshot
    snapshot: undefined,
  })

// PIN-12: the V1 snapshot shape has no wrapped read key to populate.
const _v1SnapshotWithKey: SubmissionSnapshotV1 = {
  _v: 1,
  contentFormat: 'v1',
  formId: 'form-1',
  submissionId: 'sub-1',
  submissionIndex: 0,
  workflowStep: 0,
  encryptedContent: 'form-key-encrypted',
  createdAt: '2026-07-22T00:00:00.000Z',
  // @ts-expect-error the V1 snapshot shape stores no wrapped read key
  encryptedSubmissionSecretKey: 'wrapped-read-key',
}

// Referenced so nothing here is dead-code-eliminated before `tsc` sees it.
export const V1_PAYLOAD_TYPE_ASSERTIONS = [
  _withWorkflowContent,
  _withSubmissionSecretKey,
  _v1WithoutSnapshot,
  _v1SnapshotWithKey,
] as const
