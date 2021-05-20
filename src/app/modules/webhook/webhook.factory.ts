import { errAsync } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import { startWebhookConsumer } from './webhook.consumer'
import { WebhookProducer } from './webhook.producer'
import * as WebhookService from './webhook.service'

interface IWebhookFactory {
  sendInitialWebhook: ReturnType<
    typeof WebhookService.createInitialWebhookSender
  >
}

export const createWebhookFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.WebhookVerifiedContent>): IWebhookFactory => {
  if (isEnabled && props) {
    const { webhookQueueUrl } = props
    let producer: WebhookProducer | undefined
    if (webhookQueueUrl) {
      producer = new WebhookProducer(webhookQueueUrl)
      startWebhookConsumer(webhookQueueUrl, producer)
    }
    return {
      sendInitialWebhook: WebhookService.createInitialWebhookSender(producer),
    }
  }
  const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
  return {
    sendInitialWebhook: () => errAsync(error),
  }
}

const webhookFeature = FeatureManager.get(FeatureNames.WebhookVerifiedContent)
export const WebhookFactory = createWebhookFactory(webhookFeature)
