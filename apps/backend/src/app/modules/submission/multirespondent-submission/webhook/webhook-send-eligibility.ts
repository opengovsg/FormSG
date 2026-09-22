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
  WebhookContentFormat,
} from './webhook-payload-policy'

const logger = createLoggerWithLabel(module)

export const MAX_V1_WORKFLOW_STEP_COUNT = 1

export const shouldSendMrfWebhook = ({
  webhookConsumerType,
  contentFormat,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  webhookConsumerType: WebhookConsumerType
  contentFormat: WebhookContentFormat
  isMrfWebhooksEnabled: boolean
  workflowStepCount: number
}): boolean => {
  if (webhookConsumerType === 'plumber') {
    return true
  }
  if (!isMrfWebhooksEnabled) {
    return false
  }

  return (
    contentFormat !== 'v1' || workflowStepCount <= MAX_V1_WORKFLOW_STEP_COUNT
  )
}

/**
 * Checks if a MRF webhook is eligible for delivery.
 * @param mrfVersion - The version of the MRF.
 * @param webhook - The webhook object.
 * @param isMrfWebhooksEnabled - Whether MRF webhooks are enabled.
 * @param workflowStepCount - The number of steps in the workflow.
 * @returns The content format of the MRF webhook if eligible, undefined otherwise.
 */
export const getWebhookContentFormatIfEligible = ({
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
  const contentFormat = resolveWebhookContentFormat({
    webhookType: webhookConsumerType,
    webhookFormat: webhook.webhookFormat,
  })
  if (
    !shouldSendMrfWebhook({
      webhookConsumerType,
      contentFormat,
      isMrfWebhooksEnabled,
      workflowStepCount,
    })
  ) {
    return undefined
  }

  return contentFormat
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
