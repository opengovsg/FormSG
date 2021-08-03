import formSgSdk from '@opengovsg/formsg-sdk'

import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '../../../shared/util/verification'
import { injectedVariables } from '../utils/injectedVariables'

export const FormSgSdk: ReturnType<typeof formSgSdk> = formSgSdk({
  mode: injectedVariables.formsgSdkMode,
  verificationOptions: {
    transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})
