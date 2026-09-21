import { FormWebhook } from 'formsg-shared/types'

import { createLoggerWithLabel } from '../../../../config/logger'
import {
  getWebhookType,
  toConsumerType,
} from '../../../webhook/webhook.service'

import { SnapshotContentFormat } from './submission-snapshot.schema'
import {
  resolveWebhookContentFormat,
  WebhookConsumerType,
} from './webhook-payload-policy'

const logger = createLoggerWithLabel(module)

export const MAX_V1_WORKFLOW_STEP_COUNT = 1

export const shouldSendMrfWebhook = ({
  webhookConsumerType,
  webhookFormat,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  webhookConsumerType: WebhookConsumerType
  webhookFormat: FormWebhook['webhookFormat']
  isMrfWebhooksEnabled: boolean
  workflowStepCount: number
}): boolean => {
  if (webhookConsumerType === 'plumber') {
    return true
  }
  if (!isMrfWebhooksEnabled) {
    return false
  }

  const webhookContentFormat = resolveWebhookContentFormat({
    webhookType: webhookConsumerType,
    webhookFormat,
  })
  return (
    webhookContentFormat !== 'v1' ||
    workflowStepCount <= MAX_V1_WORKFLOW_STEP_COUNT
  )
}

export const resolveMrfWebhookContentFormat = ({
  mrfVersion,
  webhook,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  mrfVersion: number
  webhook?: {
    url?: string
    webhookFormat?: FormWebhook['webhookFormat']
  }
  isMrfWebhooksEnabled: boolean
  workflowStepCount: number
}): SnapshotContentFormat | undefined => {
  const url = webhook?.url
  if (mrfVersion !== 2 || !url) {
    return undefined
  }

  const webhookConsumerType = toConsumerType(getWebhookType(url))
  if (
    !shouldSendMrfWebhook({
      webhookConsumerType,
      webhookFormat: webhook.webhookFormat,
      isMrfWebhooksEnabled,
      workflowStepCount,
    })
  ) {
    return undefined
  }

  const webhookContentFormat = resolveWebhookContentFormat({
    webhookType: webhookConsumerType,
    webhookFormat: webhook.webhookFormat,
  })
  return webhookContentFormat === 'v3' ? undefined : webhookContentFormat
}

export const shouldWriteMrfSnapshot = ({
  webhookContentFormat,
  isRetryEnabled,
}: {
  webhookContentFormat: SnapshotContentFormat | undefined
  isRetryEnabled?: boolean
}): boolean => webhookContentFormat !== undefined && !!isRetryEnabled

export const holdsV1FirstStepInvariant = ({
  submissionIndex,
  logMeta,
}: {
  submissionIndex: number
  logMeta: Record<string, unknown>
}): boolean => {
  if (submissionIndex === 0) {
    return true
  }

  logger.error({
    message:
      'V1 webhook content format resolved for a submission past its first step',
    meta: {
      action: 'holdsV1FirstStepInvariant',
      ...logMeta,
      submissionIndex,
    },
  })
  return false
}
