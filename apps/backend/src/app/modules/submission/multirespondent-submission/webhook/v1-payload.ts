import { err, ok, Result } from 'neverthrow'

import { WebhookData } from '../../../../../types'
import { createLoggerWithLabel } from '../../../../config/logger'
import { PaymentWebhookEventObject } from '../../../webhook/webhook.types'

const logger = createLoggerWithLabel(module)

// RATIONALE: Declared separately so new v4 only WebhookData keys cannot
// enter V1 payload implicitly.
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

const OPTIONAL_KEYS = new Set(['verifiedContent', 'paymentContent'])

export class V1PayloadKeySetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'V1PayloadKeySetError'
  }
}

/**
 * Runtime gate on the V1 webhook send path. After reconstruct, confirms the
 * serialised key set matches a storage mode webhook key set.
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
