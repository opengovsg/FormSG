import { FormWebhook } from 'formsg-shared/types'

import {
  getWebhookType,
  toConsumerType,
} from '../../../webhook/webhook.service'

import {
  resolveWebhookContentFormat,
  WebhookConsumerType,
} from './webhook-payload-policy'

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
  // RATIONALE: v1 payloads can only support forms with <= 1 workflow steps.
  const isV1WorkflowLimitExceeded =
    webhookContentFormat === 'v1' &&
    workflowStepCount > MAX_V1_WORKFLOW_STEP_COUNT
  return !isV1WorkflowLimitExceeded
}

export const shouldWriteV4Snapshot = ({
  mrfVersion,
  webhook,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  mrfVersion: number
  webhook?: {
    url?: string
    isRetryEnabled?: boolean
    webhookFormat?: FormWebhook['webhookFormat']
  }
  isMrfWebhooksEnabled: boolean
  workflowStepCount: number
}): boolean => {
  const url = webhook?.url
  if (mrfVersion !== 2 || !url || !webhook?.isRetryEnabled) return false

  const webhookConsumerType = toConsumerType(getWebhookType(url))
  if (
    !shouldSendMrfWebhook({
      webhookConsumerType,
      webhookFormat: webhook.webhookFormat,
      isMrfWebhooksEnabled,
      workflowStepCount,
    })
  ) {
    return false
  }

  return (
    resolveWebhookContentFormat({
      webhookType: webhookConsumerType,
      webhookFormat: webhook.webhookFormat,
    }) === 'v4'
  )
}
