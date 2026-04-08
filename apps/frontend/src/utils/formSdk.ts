import formsgPackage from '@opengovsg/formsg-sdk'
import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'

import { TRANSACTION_EXPIRE_AFTER_SECONDS } from 'formsg-shared/utils/verification'

import { env } from '~/env'

const formsgSdk = formsgPackage({
  mode: env.formsgSdkMode as PackageMode,
  verificationOptions: {
    transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})

export default formsgSdk
