import { getWebhookType } from '../../../webhook/webhook.service'

export const shouldSendMrfWebhook = ({
  webhookType,
  isMrfWebhooksEnabled,
  isStepWriteTokenEnabled,
}: {
  webhookType: 'zapier' | 'plumber' | 'generic'
  isMrfWebhooksEnabled: boolean
  isStepWriteTokenEnabled: boolean
}): boolean => {
  switch (webhookType) {
    case 'plumber':
      return true
    case 'zapier':
    case 'generic':
      return isMrfWebhooksEnabled && isStepWriteTokenEnabled
  }
}

export const shouldWriteV4Snapshot = ({
  mrfVersion,
  webhook,
  isMrfWebhooksEnabled,
  isStepWriteTokenEnabled,
}: {
  mrfVersion: number
  webhook?: { url?: string; isRetryEnabled?: boolean }
  isMrfWebhooksEnabled: boolean
  isStepWriteTokenEnabled: boolean
}): boolean => {
  const url = webhook?.url
  if (mrfVersion !== 2 || !url || !webhook?.isRetryEnabled) return false

  return shouldSendMrfWebhook({
    webhookType: getWebhookType(url),
    isMrfWebhooksEnabled,
    isStepWriteTokenEnabled,
  })
}
