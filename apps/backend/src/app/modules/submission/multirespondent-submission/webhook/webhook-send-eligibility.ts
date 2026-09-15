import { FormWebhook } from 'formsg-shared/types'

import {
  getWebhookType,
  toConsumerType,
  WebhookType,
} from '../../../webhook/webhook.service'

import { resolveWireShape } from './webhook-payload-policy'

/**
 * PIN-02: the send predicate is form shape, not step index.
 *
 * The restriction belongs to the V1 wire shape, not to the consumer. A V1
 * payload is storage-shaped, and a storage-mode submission is one submission:
 * the shape has nowhere to put a second step. So a consumer resolving to V1
 * receives a webhook if and only if the submission's own workflow has at most
 * one step — no workflow, an empty workflow, or a workflow of exactly one.
 * Those forms complete on their first submission and reject any second one,
 * so the payload is always complete and the row is never mutated after commit.
 *
 * A step-index-only rule would let a multi-step form emit one V1 payload
 * indistinguishable from a complete submission but missing every later step,
 * which is a silent data-correctness fault in the consumer's system — worse
 * than no delivery.
 *
 * Every other shape is unrestricted, for the same reason stated the other way
 * round. The V4 envelope carries the step it belongs to, so a consumer can
 * tell a step-1 payload from a complete submission and a multi-step form is
 * delivered at every step. That covers plumber, which always resolves to V4,
 * and equally a generic consumer whose form asks for V4 — the exemption is a
 * property of the shape, so naming plumber for it would be reading the
 * consumer where the shape is what matters.
 *
 * The count must come from the *submission row's own* persisted workflow
 * copy, never the live form, so that editing the workflow mid-flight cannot
 * change the rule for a submission already in progress.
 */
export const shouldSendMrfWebhook = ({
  webhookType,
  webhookFormat,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  webhookType: WebhookType
  /**
   * The form's own setting. Absent resolves to V1, which is the restricted
   * shape, so a caller that forgets the term fails closed on a multi-step
   * form rather than delivering a payload that cannot hold it.
   */
  webhookFormat: FormWebhook['webhookFormat']
  isMrfWebhooksEnabled: boolean
  /**
   * Number of steps on the submission row's own workflow copy. Mandatory
   * rather than optional so that no call site can forget the term and
   * silently fall back to "any shape delivers".
   */
  workflowStepCount: number
}): boolean => {
  if (webhookType !== 'plumber' && !isMrfWebhooksEnabled) return false

  const wireShape = resolveWireShape({
    webhookType: toConsumerType(webhookType),
    webhookFormat,
  })

  return wireShape !== 'v1' || workflowStepCount <= 1
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
    resolveWireShape({
      webhookType: toConsumerType(webhookType),
      webhookFormat: webhook.webhookFormat,
    }) === 'v4'
  )
}
