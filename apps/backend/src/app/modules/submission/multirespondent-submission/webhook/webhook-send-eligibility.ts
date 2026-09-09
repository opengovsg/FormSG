import { getWebhookType, WebhookType } from '../../../webhook/webhook.service'

export const shouldSendMrfWebhook = ({
  webhookType,
  isMrfWebhooksEnabled,
}: {
  webhookType: WebhookType
  isMrfWebhooksEnabled: boolean
}): boolean => {
  switch (webhookType) {
    case 'plumber':
      return true
    case 'zapier':
    case 'generic':
      return isMrfWebhooksEnabled
  }
}

export const shouldWriteV4Snapshot = ({
  mrfVersion,
  webhook,
  isMrfWebhooksEnabled,
}: {
  mrfVersion: number
  webhook?: { url?: string; isRetryEnabled?: boolean }
  isMrfWebhooksEnabled: boolean
}): boolean => {
  const url = webhook?.url
  if (mrfVersion !== 2 || !url || !webhook?.isRetryEnabled) return false

  return shouldSendMrfWebhook({
    webhookType: getWebhookType(url),
    isMrfWebhooksEnabled,
  })
}
