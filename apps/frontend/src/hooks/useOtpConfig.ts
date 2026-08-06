import { useFeatureValue } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

const LEGACY_OTP_LENGTH = 6

/**
 * Reads the `otp-entropy-expanded` GrowthBook feature (number-valued length of
 * expanded alphanumeric OTPs, 0 or unset = legacy 6-digit numeric OTPs) and
 * returns the config OTP inputs should validate against.
 */
export const useOtpConfig = (): {
  otpLength: number
  isExpandedOtp: boolean
} => {
  const expandedOtpLength = useFeatureValue<number>(
    featureFlags.otpEntropyExpanded,
    0,
  )
  const isExpandedOtp = expandedOtpLength > 0
  return {
    otpLength: isExpandedOtp ? expandedOtpLength : LEGACY_OTP_LENGTH,
    isExpandedOtp,
  }
}
