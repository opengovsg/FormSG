import formSgSdk from '@opengovsg/formsg-sdk'
import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'

import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '../../shared/util/verification'

const sdkMode = (process.env.FORMSG_SDK_MODE || 'production') as PackageMode

export default formSgSdk({
  mode: sdkMode,
  verificationOptions: {
    transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})
