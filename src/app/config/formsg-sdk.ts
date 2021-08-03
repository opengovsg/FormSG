import formsgSdkPackage from '@opengovsg/formsg-sdk'

import * as vfnConstants from '../../../shared/utils/verification'

import { verifiedFieldsConfig } from './features/verified-fields.config'
import { webhooksAndVerifiedContentConfig } from './features/webhook-verified-content.config'
import { formsgSdkMode } from './config'

const formsgSdk = formsgSdkPackage({
  webhookSecretKey: webhooksAndVerifiedContentConfig.signingSecretKey,
  mode: formsgSdkMode,
  verificationOptions: {
    secretKey: verifiedFieldsConfig.verificationSecretKey,
    transactionExpiry: vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})

export = formsgSdk
