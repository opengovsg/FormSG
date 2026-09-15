import { getWebhookType, WebhookType } from '../../../webhook/webhook.service'

/**
 * PIN-02: the send predicate is form shape, not step index.
 *
 * A non-plumber consumer receives a webhook if and only if the submission's
 * own workflow has at most one step — no workflow, an empty workflow, or a
 * workflow of length exactly one. Those forms complete on their first
 * submission and reject any second one, so the payload is always complete and
 * the row is never mutated after commit.
 *
 * A step-index-only rule would let a multi-step form emit one payload
 * indistinguishable from a complete submission but missing every later step,
 * which is a silent data-correctness fault in the consumer's system — worse
 * than no delivery.
 *
 * The count must come from the *submission row's own* persisted workflow
 * copy, never the live form, so that editing the workflow mid-flight cannot
 * change the rule for a submission already in progress.
 *
 * Plumber is exempt, and the exemption is the point: the restriction exists
 * because the V1 wire shape cannot represent a multi-step submission, and
 * plumber receives V4, which can.
 */
export const shouldSendMrfWebhook = ({
  webhookType,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  webhookType: WebhookType
  isMrfWebhooksEnabled: boolean
  /**
   * Number of steps on the submission row's own workflow copy. Mandatory
   * rather than optional so that no call site can forget the term and
   * silently fall back to "any shape delivers".
   */
  workflowStepCount: number
}): boolean => {
  switch (webhookType) {
    case 'plumber':
      return true
    case 'zapier':
    case 'generic':
      return isMrfWebhooksEnabled && workflowStepCount <= 1
  }
}

/**
 * PIN-16: the snapshot-write condition at both submit sites is
 * `enable-mrf-webhooks` on AND a webhook URL present AND retries enabled —
 * and, now, a form shape that is actually delivered to. A snapshot is only
 * ever read by a retry, so writing one for a submission no consumer receives
 * produces an object nothing will ever read, which under PIN-10's no-expiry
 * rule accumulates permanently.
 */
export const shouldWriteV4Snapshot = ({
  mrfVersion,
  webhook,
  isMrfWebhooksEnabled,
  workflowStepCount,
}: {
  mrfVersion: number
  webhook?: { url?: string; isRetryEnabled?: boolean }
  isMrfWebhooksEnabled: boolean
  workflowStepCount: number
}): boolean => {
  const url = webhook?.url
  if (mrfVersion !== 2 || !url || !webhook?.isRetryEnabled) return false

  return shouldSendMrfWebhook({
    webhookType: getWebhookType(url),
    isMrfWebhooksEnabled,
    workflowStepCount,
  })
}
