import formsgSdkPackage from '@opengovsg/formsg-sdk'
import * as vfnConstants from 'formsg-shared/utils/verification'

import { formsgSdkMode } from './config'
import { verifiedFieldsConfig } from './features/verified-fields.config'
import { webhooksAndVerifiedContentConfig } from './features/webhook-verified-content.config'

const formsgSdk = formsgSdkPackage({
  webhookSecretKey: webhooksAndVerifiedContentConfig.signingSecretKey,
  mode: formsgSdkMode,
  verificationOptions: {
    secretKey: verifiedFieldsConfig.verificationSecretKey,
    transactionExpiry: vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})

export = formsgSdk
