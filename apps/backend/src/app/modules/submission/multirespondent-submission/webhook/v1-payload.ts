import { err, ok, Result } from 'neverthrow'

import { WebhookData } from '../../../../../types'
import { createLoggerWithLabel } from '../../../../config/logger'
import { PaymentWebhookEventObject } from '../../../webhook/webhook.types'

const logger = createLoggerWithLabel(module)

/**
 * PIN-04 of #9972: the V1 payload's `data` key set is exactly storage mode's.
 *
 * Declared positively — as its own interface listing the permitted keys — and
 * deliberately NOT as `Omit<WebhookData, 'workflowContent' |
 * 'encryptedSubmissionSecretKey'>`. A subtractive type fails open: the day
 * somebody adds a new MRF-only key to `WebhookData`, `Omit` goes on excluding
 * only the two names it was given and the new key silently joins the V1 wire.
 * A positive declaration makes that a deliberate edit to this file.
 *
 * The key set is the one `EncryptSubmissionSchema.methods.getWebhookView`
 * builds (`submission.server.model.ts`), which is what a storage-mode
 * consumer's parser — and its strict schema validator — is written against.
 *
 * Omitting workflow metadata is intended twice over: it keeps the key set
 * identical for those validators, and it keeps respondent email addresses,
 * which the row's workflow copy carries unstripped, off the V1 wire entirely
 * rather than relying on a field allow-list to hold them back.
 */
export interface StorageShapedWebhookData {
  formId: WebhookData['formId']
  submissionId: WebhookData['submissionId']
  encryptedContent: WebhookData['encryptedContent']
  verifiedContent: WebhookData['verifiedContent']
  version: WebhookData['version']
  created: WebhookData['created']
  attachmentDownloadUrls: WebhookData['attachmentDownloadUrls']
  paymentContent?: PaymentWebhookEventObject | object
}

/**
 * Every key a storage-mode payload may carry, in the order that view builds
 * them. Kept beside the interface so the two are edited together.
 */
export const STORAGE_SHAPED_PAYLOAD_KEYS: readonly string[] = [
  'formId',
  'submissionId',
  'encryptedContent',
  'verifiedContent',
  'version',
  'created',
  'attachmentDownloadUrls',
  'paymentContent',
]

/**
 * The two keys that may legitimately be absent from a serialised payload:
 * `verifiedContent` is `undefined` on an unauthenticated form, and
 * `JSON.stringify` drops a present-but-undefined key. `paymentContent` is
 * always emitted by both modes today, but a row that somehow lacked it is not
 * a reason to withhold an otherwise correct delivery.
 */
const OPTIONAL_KEYS = new Set(['verifiedContent', 'paymentContent'])

export class V1PayloadKeySetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'V1PayloadKeySetError'
  }
}

/**
 * The runtime half of PIN-04, and it is needed because the type only covers
 * half the distance: both forbidden keys are *optional* on `WebhookData`, so a
 * V1 payload stays structurally assignable to it. The interface therefore
 * protects the construction site — an object literal naming `workflowContent`
 * is an excess-property error — and stops protecting the moment the value is
 * handed to the shared send path as a `WebhookView`.
 *
 * So check the bytes. Comparison is against the keys that survive
 * serialisation (`JSON.parse(JSON.stringify(...))`), because the delivered
 * bytes are the JSON: a present-but-`undefined` key is not on the wire, and a
 * raw `Object.keys` comparison would fail an unauthenticated form for a key
 * no consumer ever sees.
 *
 * It fails closed, in production and not only in CI: a payload carrying a key
 * storage mode never sends is not delivered at all.
 */
export const assertStorageShapedKeySet = (
  data: StorageShapedWebhookData,
  logMeta: Record<string, unknown>,
): Result<StorageShapedWebhookData, V1PayloadKeySetError> => {
  const serialisedKeys = Object.keys(
    JSON.parse(JSON.stringify(data)) as Record<string, unknown>,
  )

  const unexpected = serialisedKeys.filter(
    (key) => !STORAGE_SHAPED_PAYLOAD_KEYS.includes(key),
  )
  const missing = STORAGE_SHAPED_PAYLOAD_KEYS.filter(
    (key) => !OPTIONAL_KEYS.has(key) && !serialisedKeys.includes(key),
  )

  if (unexpected.length === 0 && missing.length === 0) {
    return ok(data)
  }

  const error = new V1PayloadKeySetError(
    `V1 payload key set does not match storage mode's: unexpected [${unexpected.join(
      ', ',
    )}], missing [${missing.join(', ')}]`,
  )
  logger.error({
    message: 'V1 webhook payload key set diverged from storage mode',
    meta: {
      action: 'assertStorageShapedKeySet',
      ...logMeta,
      unexpected,
      missing,
    },
    error,
  })
  return err(error)
}
