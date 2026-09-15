import { FormWebhook } from 'formsg-shared/types'

import { createLoggerWithLabel } from '../../../../config/logger'
import {
  getWebhookType,
  toConsumerType,
  WebhookType,
} from '../../../webhook/webhook.service'

import { SnapshotContentFormat } from './submission-snapshot.schema'
import { resolveWireShape } from './webhook-payload-policy'

const logger = createLoggerWithLabel(module)

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
 * PIN-12: one snapshot per step, in the delivered shape only — so the
 * snapshot-write decision is shape-aware, and the resolved wire shape selects
 * both the snapshot's shape and its store. A generic V1 form writes only a V1
 * snapshot and never a V4 one: no wrapped read key is stored for a consumer
 * class forbidden from receiving it, and there is no second S3 write to fail
 * under S3-first-abort.
 *
 * PIN-16: the write condition at both submit sites is `enable-mrf-webhooks`
 * on AND a webhook URL present AND retries enabled, identical for the V4 and
 * V1 shapes. Keeping the retry term is what makes this merge inert and stops
 * us writing objects nothing will read — both submit sites serve the initial
 * send from the copy already in memory, so the snapshot is only ever read by a
 * retry, and under PIN-10 an unread object never expires. The term is dropped
 * only at the payment pending-submission site, where no in-memory copy exists
 * in the process that sends; that site belongs to #9978.
 *
 * @returns the shape to snapshot in, or `undefined` to write no snapshot.
 */
export const resolveMrfSnapshotShape = ({
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
}): SnapshotContentFormat | undefined => {
  const url = webhook?.url
  if (mrfVersion !== 2 || !url || !webhook?.isRetryEnabled) return undefined

  const webhookType = getWebhookType(url)
  if (
    !shouldSendMrfWebhook({
      webhookType,
      webhookFormat: webhook.webhookFormat,
      isMrfWebhooksEnabled,
      workflowStepCount,
    })
  ) {
    return undefined
  }

  // The snapshot's shape IS the wire shape, resolved by the one function the
  // send path resolves it with, so the bytes written and the bytes sent cannot
  // disagree about what they are.
  const wireShape = resolveWireShape({
    webhookType: toConsumerType(webhookType),
    webhookFormat: webhook.webhookFormat,
  })

  // `v3` is the legacy row format, never a snapshot shape. The `mrfVersion`
  // check above has already excluded it; narrowed rather than cast so that a
  // widened resolution has to be dealt with here.
  return wireShape === 'v3' ? undefined : wireShape
}

/**
 * PIN-02 retains `submissionIndex === 0` as an invariant assertion that fails
 * loud if ever violated — a consistency check, not the gate.
 *
 * The V1 shape resolves only for a workflow of at most one step, and such a
 * form completes on its first submission, so a V1 resolution on a later step
 * means the two facts have gone out of sync. Rather than deliver a payload
 * whose completeness can no longer be reasoned about, say so loudly and
 * decline.
 *
 * @returns true when the invariant holds and the V1 shape may proceed.
 */
export const holdsV1FirstStepInvariant = ({
  submissionIndex,
  logMeta,
}: {
  submissionIndex: number
  logMeta: Record<string, unknown>
}): boolean => {
  if (submissionIndex === 0) return true

  logger.error({
    message:
      'V1 wire shape resolved for a submission past its first step, which a single-step workflow cannot produce',
    meta: {
      action: 'holdsV1FirstStepInvariant',
      ...logMeta,
      submissionIndex,
    },
  })
  return false
}
