import { createLoggerWithLabel } from '../../../../config/logger'

import {
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
  // Plumber bypasses the rollout flag only; the V1 step-count gate below
  // applies to every consumer, since V1 cannot deliver past the first step.
  if (webhookConsumerType !== 'plumber' && !isMrfWebhooksEnabled) {
    return false
  }

  return (
    contentFormat !== 'v1' || workflowStepCount <= MAX_V1_WORKFLOW_STEP_COUNT
  )
}

export const shouldWriteMrfSnapshot = ({
  mrfVersion,
  shouldSend,
  isRetryEnabled,
  contentFormat,
  submissionIndex,
  logMeta,
}: {
  mrfVersion: number
  shouldSend: boolean
  isRetryEnabled?: boolean
  contentFormat: WebhookContentFormat
  submissionIndex: number
  logMeta: Record<string, unknown>
}): boolean => {
  return (
    mrfVersion === 2 &&
    shouldSend &&
    (contentFormat !== 'v1' ||
      holdsV1FirstStepInvariant({ submissionIndex, logMeta })) &&
    isRetryEnabled === true
  )
}

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
