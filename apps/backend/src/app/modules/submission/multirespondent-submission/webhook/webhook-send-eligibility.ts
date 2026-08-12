import { getWebhookType, WebhookType } from '../../../webhook/webhook.service'

/**
 * Decides whether an MRF webhook is delivered at all.
 *
 * Two independent release flags, one per consumer class:
 * - Plumber is always delivered. Its v3→v4 wire cutover is governed by
 *   `mrf-step-write-token` at storage time (see getMrfVersion): the wire
 *   version follows the stored mrfVersion, so storage and wire are one
 *   decision for plumber.
 * - Non-plumber (generic/zapier) consumers are v3-only, gated by
 *   `mrf-webhooks-v3-generic`. The `mrfVersion !== 2` guard encodes the
 *   invariant that a v3 consumer can never receive v4-shaped bytes: the
 *   server cannot transcode client-facing encrypted content, so a V4 row
 *   (e.g. one written before a webhook URL was configured) is dropped
 *   rather than delivered in the wrong format.
 */
export const shouldSendMrfWebhook = ({
  webhookType,
  mrfVersion,
  isMrfWebhooksV3GenericEnabled,
}: {
  webhookType: WebhookType
  mrfVersion: number
  isMrfWebhooksV3GenericEnabled: boolean
}): boolean => {
  switch (webhookType) {
    case 'plumber':
      return true
    case 'zapier':
    case 'generic':
      return isMrfWebhooksV3GenericEnabled && mrfVersion !== 2
  }
}

export const shouldWriteV4Snapshot = ({
  mrfVersion,
  webhook,
  isMrfWebhooksV3GenericEnabled,
}: {
  mrfVersion: number
  webhook?: { url?: string; isRetryEnabled?: boolean }
  isMrfWebhooksV3GenericEnabled: boolean
}): boolean => {
  const url = webhook?.url
  if (mrfVersion !== 2 || !url || !webhook?.isRetryEnabled) return false

  // A snapshot is only useful if the (V4) webhook would actually be
  // delivered. Non-plumber consumers never receive V4 payloads, so in
  // practice only plumber V4 rows snapshot.
  return shouldSendMrfWebhook({
    webhookType: getWebhookType(url),
    mrfVersion,
    isMrfWebhooksV3GenericEnabled,
  })
}
