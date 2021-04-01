import { errAsync } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import * as WebhookService from './webhook.service'

interface IWebhookFactory {
  sendWebhook: typeof WebhookService.sendWebhook
  saveWebhookRecord: typeof WebhookService.saveWebhookRecord
}

export const createWebhookFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.WebhookVerifiedContent>): IWebhookFactory => {
  if (isEnabled && props) return WebhookService
  const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
  return {
    sendWebhook: () => errAsync(error),
    saveWebhookRecord: () => errAsync(error),
  }
}

const webhookFeature = FeatureManager.get(FeatureNames.WebhookVerifiedContent)
export const WebhookFactory = createWebhookFactory(webhookFeature)
