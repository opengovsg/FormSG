import formsgSdkPackage from '@opengovsg/formsg-sdk'

import * as vfnConstants from '../shared/util/verification'
import { formsgSdkMode } from './config'
import featureManager from './feature-manager'
import { FeatureNames } from './feature-manager/types'

const formsgSdk = formsgSdkPackage({
  webhookSecretKey:
    featureManager.props(FeatureNames.WebhookVerifiedContent)
      .signingSecretKey || '',
  mode: formsgSdkMode,
  verificationOptions: {
    secretKey:
      featureManager.props(FeatureNames.VerifiedFields).verificationSecretKey ||
      '',
    transactionExpiry: vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})

export = formsgSdk
