import formsgPackage from '@opengovsg/formsg-sdk'

import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '~shared/utils/verification'

const formsgSdk = formsgPackage({
  mode: process.env.NODE_ENV,
  verificationOptions: {
    transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})

export default formsgSdk
