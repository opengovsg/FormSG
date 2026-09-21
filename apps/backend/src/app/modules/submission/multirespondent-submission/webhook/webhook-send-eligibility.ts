import { FormWebhook } from 'formsg-shared/types'

import {
  getWebhookType,
  toConsumerType,
  WebhookType,
} from '../../../webhook/webhook.service'

import { resolveWebhookContentFormat } from './webhook-payload-policy'

export const shouldSendMrfWebhook = ({
  webhookType,
  webhookFormat,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  webhookType: WebhookType
  webhookFormat: FormWebhook['webhookFormat']
  isMrfWebhooksEnabled: boolean
  workflowStepCount: number
}): boolean => {
  if (webhookType === 'plumber') {
    return true
  }
  if (!isMrfWebhooksEnabled) {
    return false
  }

  const webhookContentFormat = resolveWebhookContentFormat({
    webhookType: toConsumerType(webhookType),
    webhookFormat,
  })

  return webhookContentFormat === 'v4' || workflowStepCount <= 1
}

/**
 * PIN-16: the snapshot-write condition at both submit sites is
 * `enable-mrf-webhooks` on AND a webhook URL present AND retries enabled —
 * and, now, a form that is actually delivered to, in the shape this snapshot
 * holds. A snapshot is only ever read by a retry, so writing one nothing will
 * ever read produces an object that under PIN-10's no-expiry rule accumulates
 * permanently.
 *
 * The V4 in the name is a precondition, not a label. A form that resolves to
 * the V1 wire shape gets no V4 snapshot: the object would be the wrong shape
 * in the wrong store, and the V1 store and producer do not exist yet. Nothing
 * is lost by declining, because for the V4 shape the live row IS the wire
 * payload, so a retry with no snapshot still reconstructs byte-correctly.
 *
 * This becomes `resolveMrfSnapshotShape` when the V1 producer lands: the same
 * question, answered with the shape to write instead of a yes for one shape.
 */
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

  const webhookType = getWebhookType(url)
  if (
    !shouldSendMrfWebhook({
      webhookType,
      webhookFormat: webhook.webhookFormat,
      isMrfWebhooksEnabled,
      workflowStepCount,
    })
  ) {
    return false
  }

  // The shape decides the snapshot, through the one resolver the send path
  // uses, so a V4 object is never written for a submission that resolves to
  // any other shape.
  return (
    resolveWebhookContentFormat({
      webhookType: toConsumerType(webhookType),
      webhookFormat: webhook.webhookFormat,
    }) === 'v4'
  )
}
