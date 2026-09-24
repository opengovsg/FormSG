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
  contentFormat: WebhookContentFormat
}): Omit<WebhookPayloadPolicy, 'contentFormat'> => ({
  includeEncryptedSubmissionSecretKey: contentFormat === 'v4',
})

export const resolveWebhookContentFormat = ({
  webhookType,
  webhookFormat,
}: Pick<
  WebhookPayloadPolicyInput,
  'webhookType' | 'webhookFormat'
>): FormWebhookFormat =>
  webhookType === 'plumber'
    ? FORMAT_FOR_PLUMBER_WEBHOOKS
    : (webhookFormat ?? FORMAT_FOR_NEW_GENERIC_WEBHOOKS)

export const getWebhookPayloadPolicy = ({
  webhookType,
  webhookFormat,
  logMeta,
}: WebhookPayloadPolicyInput): WebhookPayloadPolicy => {
  const contentFormat = resolveWebhookContentFormat({
    webhookType,
    webhookFormat,
  })

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

  return {
    contentFormat,
    ...getKeyPermissionsPolicy({ contentFormat }),
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
