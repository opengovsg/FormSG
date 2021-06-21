import { webhooksAndVerifiedContentConfig } from '../../config/feature-manager/webhook-verified-content.config'

import { startWebhookConsumer } from './webhook.consumer'
import { WebhookProducer } from './webhook.producer'
import * as WebhookService from './webhook.service'

interface IWebhookFactory {
  sendInitialWebhook: ReturnType<
    typeof WebhookService.createInitialWebhookSender
  >
}

export const createWebhookFactory = (
  webhookQueueUrl: string,
): IWebhookFactory => {
  let producer: WebhookProducer | undefined
  if (webhookQueueUrl) {
    producer = new WebhookProducer(webhookQueueUrl)
    startWebhookConsumer(webhookQueueUrl, producer)
  }
  return {
    sendInitialWebhook: WebhookService.createInitialWebhookSender(producer),
  }
}

export const WebhookFactory = createWebhookFactory(
  webhooksAndVerifiedContentConfig.webhookQueueUrl,
)
