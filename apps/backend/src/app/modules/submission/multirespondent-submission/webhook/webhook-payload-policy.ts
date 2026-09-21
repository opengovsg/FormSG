import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import {
  FORMAT_FOR_NEW_GENERIC_WEBHOOKS,
  FORMAT_FOR_PLUMBER_WEBHOOKS,
  FormWebhook,
  FormWebhookFormat,
} from 'formsg-shared/types'

import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../../config/logger'

const logger = createLoggerWithLabel(module)

export type WebhookContentFormat = FormWebhookFormat | 'v3'

// This is not the same as WebhookType, this is the classes of webhook consumers (ie, internal or external)
export type WebhookConsumerType = 'plumber' | 'generic'

export interface WebhookPayloadPolicyInput {
  webhookType: WebhookConsumerType
  webhookFormat: FormWebhook['webhookFormat']
  submissionIndex: number
  submittedStepsLength: number
  logMeta?: CustomLoggerParams['meta']
}

export interface KeyPermissionsPolicy {
  includeEncryptedSubmissionSecretKey: boolean
}
export interface WebhookPayloadPolicy extends KeyPermissionsPolicy {
  contentFormat: WebhookContentFormat
}

export const getKeyPermissionsPolicy = ({
  contentFormat,
}: {
  webhookType: WebhookConsumerType
  submissionIndex: number
  submittedStepsLength: number
  contentFormat: WebhookContentFormat
}): Omit<WebhookPayloadPolicy, 'contentFormat'> => {
  return {
    includeEncryptedSubmissionSecretKey: contentFormat === 'v4',
  }
}

/**
 * Resolves the wire shape a consumer receives, and nothing else.
 *
 * Split out from `getWebhookPayloadPolicy` because the snapshot-write
 * decision needs the same answer (PIN-12: the resolved wire shape selects the
 * snapshot's shape and bucket) but has no submission index or step count to
 * hand a full policy input. One function, so the bytes written and the bytes
 * sent cannot resolve differently.
 *
 * | Consumer         | `webhookFormat` | Wire shape |
 * |------------------|-----------------|------------|
 * | plumber          | any (ignored)   | `v4`       |
 * | generic / zapier | unset or `'v1'` | `v1`       |
 * | generic / zapier | `'v4'`          | `v4`       |
 *
 * Plumber ignores the setting because the native V4 envelope is what it is
 * built against; the setting exists for the external consumers that parse a
 * storage-mode payload.
 *
 * Absent resolves to `FORMAT_FOR_NEW_GENERIC_WEBHOOKS` HERE and not as a
 * mongoose default, so existing rows need no migration and absent stays
 * indistinguishable from an explicit `'v1'`.
 *
 * The third row is unreachable today — request validation accepts `'v1'`
 * only — but the resolver states it anyway, because the mongoose enum
 * carries `'v4'` and enabling it is meant to be a one-line validation change
 * rather than a change here.
 *
 * Deliberately silent: the absent-format warning belongs on the send path
 * alone (see `getWebhookPayloadPolicy`), because the snapshot-write decision
 * calls this for the same submission and a warning here would double-log.
 */
export const resolveWireShape = ({
  webhookType,
  webhookFormat,
}: Pick<
  WebhookPayloadPolicyInput,
  'webhookType' | 'webhookFormat'
>): WebhookContentFormat =>
  webhookType === 'plumber'
    ? FORMAT_FOR_PLUMBER_WEBHOOKS
    : (webhookFormat ?? FORMAT_FOR_NEW_GENERIC_WEBHOOKS)

/**
 * Resolves the wire shape together with the key permissions that follow from
 * it. See {@link resolveWireShape} for the resolution table.
 */
export const getWebhookPayloadPolicy = ({
  webhookType,
  webhookFormat,
  submissionIndex,
  submittedStepsLength,
  logMeta,
}: WebhookPayloadPolicyInput): WebhookPayloadPolicy => {
  const contentFormat = resolveWireShape({ webhookType, webhookFormat })

  if (webhookType === 'generic' && !webhookFormat) {
    logger.warn({
      message:
        'Form has a webhook URL but no webhookFormat; resolving to the platform default',
      meta: {
        ...logMeta,
        action: 'getWebhookPayloadPolicy',
        webhookType,
        resolvedFormat: contentFormat,
      },
    })
  }

  const keyPermissionsPolicy = getKeyPermissionsPolicy({
    webhookType,
    submissionIndex,
    submittedStepsLength,
    contentFormat,
  })

  return {
    contentFormat,
    ...keyPermissionsPolicy,
  }
}

export type WebhookVersion = 2.1 | 3 | 4

export const contentFormatToWebhookVersion = (
  shape: WebhookContentFormat,
): WebhookVersion => {
  switch (shape) {
    case 'v4':
      return 4
    case 'v3':
      return 3
    case 'v1':
      return VIRUS_SCANNER_SUBMISSION_VERSION
  }
}

export const mrfVersionToContentFormat = (
  mrfVersion: number,
): WebhookContentFormat => (mrfVersion === 2 ? 'v4' : 'v3')
