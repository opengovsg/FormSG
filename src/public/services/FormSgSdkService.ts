import formSgSdk from '@opengovsg/formsg-sdk'
import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'

import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '../../shared/util/verification'

// Reading from process.env.FORMSG_SDK_MODE defaults to undefined
// This is because browsers are sandboxed and hence have to manually check on window...
const sdkMode = (((window as unknown) as { formsgSdkMode: PackageMode })
  .formsgSdkMode || 'production') as PackageMode

export const FormSgSdk: ReturnType<typeof formSgSdk> = formSgSdk({
  mode: sdkMode,
  verificationOptions: {
    transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
  },
})
