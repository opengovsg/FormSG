import { err } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import {
  EncryptVerifiedContentError,
  MalformedVerifiedContentError,
} from './verified-content.errors'
import * as VerifiedContentService from './verified-content.service'
import {
  CpVerifiedContent,
  EncryptVerificationContentParams,
  FactoryVerifiedContentResult,
  GetVerifiedContentParams,
  SpVerifiedContent,
} from './verified-content.types'

interface IVerifiedContentFactory {
  getVerifiedContent: (
    params: GetVerifiedContentParams,
  ) => FactoryVerifiedContentResult<
    CpVerifiedContent | SpVerifiedContent,
    MalformedVerifiedContentError
  >
  encryptVerifiedContent: (
    params: EncryptVerificationContentParams,
  ) => FactoryVerifiedContentResult<string, EncryptVerifiedContentError>
}

const verifiedContentFeature = FeatureManager.get(
  FeatureNames.WebhookVerifiedContent,
)

export const createVerifiedContentFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.WebhookVerifiedContent>): IVerifiedContentFactory => {
  // Feature is enabled and valid.
  if (isEnabled && props?.signingSecretKey) {
    return {
      getVerifiedContent: VerifiedContentService.getVerifiedContent,
      // Pass in signing secret key from feature manager.
      encryptVerifiedContent: ({ verifiedContent, formPublicKey }) =>
        VerifiedContentService.encryptVerifiedContent({
          verifiedContent,
          formPublicKey,
          signingSecretKey: props.signingSecretKey,
        }),
    }
  }

  return {
    getVerifiedContent: () =>
      err(new MissingFeatureError(FeatureNames.WebhookVerifiedContent)),
    encryptVerifiedContent: () =>
      err(new MissingFeatureError(FeatureNames.WebhookVerifiedContent)),
  }
}

export const VerifiedContentFactory = createVerifiedContentFactory(
  verifiedContentFeature,
)
