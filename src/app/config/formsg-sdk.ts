import formsgSdkPackage from '@opengovsg/formsg-sdk'
import { get } from 'lodash'

import * as vfnConstants from '../../shared/util/verification'

import { verifiedFieldsConfig } from './feature-manager/verified-fields.config'
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
    secretKey: verifiedFieldsConfig.verificationSecretKey,
    transactionExpiry: vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})

export = formsgSdk
