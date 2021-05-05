import formsgSdkPackage from '@opengovsg/formsg-sdk'
import { get } from 'lodash'

import * as vfnConstants from '../../shared/util/verification'

import { formsgSdkMode } from './config'
import featureManager, { FeatureNames } from './feature-manager'

const formsgSdk = formsgSdkPackage({
  webhookSecretKey: get(
    featureManager.props(FeatureNames.WebhookVerifiedContent),
    'signingSecretKey',
    undefined,
  ),
  mode: formsgSdkMode,
  verificationOptions: {
    secretKey: get(
      featureManager.props(FeatureNames.VerifiedFields),
      'verificationSecretKey',
      undefined,
    ),
    transactionExpiry: vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})

export = formsgSdk
