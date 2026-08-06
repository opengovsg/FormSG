import { GrowthBook } from '@growthbook/growthbook'
import crypto from 'crypto'
import { featureFlags } from 'formsg-shared/constants'
import { ResultAsync } from 'neverthrow'

import { hashData, HashingError } from './hash'

const DEFAULT_SALT_ROUNDS = 1

const LEGACY_OTP_LENGTH = 6

// Uppercase-only so OTPs can be entered case-insensitively; submitted OTPs are
// uppercased before hash comparison.
const EXPANDED_OTP_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Reads the expanded OTP length from the `otp-entropy-expanded` GrowthBook
 * feature (number-valued, recommended value 8).
 * @returns the expanded OTP length, or 0 if the feature is off or unavailable
 * (which means legacy 6-digit numeric OTPs)
 */
export const getExpandedOtpLength = (growthbook?: GrowthBook): number =>
  growthbook?.getFeatureValue(featureFlags.otpEntropyExpanded, 0) ?? 0

/**
 * Randomly generates and returns an OTP.
 * @param expandedOtpLength if positive, generates an uppercase alphanumeric
 * OTP of this length. Otherwise generates the legacy 6 digit numeric OTP.
 * @returns OTP string
 */
export const generateOtp = (expandedOtpLength = 0): string => {
  // Generates cryptographically strong pseudo-random data.
  if (expandedOtpLength > 0) {
    return Array(expandedOtpLength)
      .fill(0)
      .map(
        () =>
          EXPANDED_OTP_CHARSET[
            crypto.randomInt(0, EXPANDED_OTP_CHARSET.length)
          ],
      )
      .join('')
  }
  return Array(LEGACY_OTP_LENGTH)
    .fill(0)
    .map(() => crypto.randomInt(0, 10))
    .join('')
}

/**
 * Randomly generates and returns a 3 letter OTP prefix.
 * @returns 3 letter OTP prefix string
 */
export const generateOtpPrefix = (): string => {
  // Generates cryptographically strong pseudo-random data. 65 is the starting ASCII character code for upper case letters.
  return Array(3)
    .fill(0)
    .map(() => String.fromCharCode(65 + crypto.randomInt(0, 26)))
    .join('')
}

/**
 * Generates an OTP together with its hash.
 * @param logMeta Metadata to be included in logs. Defaults to empty object.
 * @param saltRounds Number of salt rounds to use when hashing. Defaults to 1.
 * @param expandedOtpLength If positive, generates an uppercase alphanumeric
 * OTP of this length instead of the legacy 6-digit numeric OTP. Defaults to 0.
 * @returns ok({ otp, hashedOtp }) if OTP generation and hashing are successful
 * @returns err(HashingError) if error occurs while hashing
 */
export const generateOtpWithHash = ({
  logMeta = {},
  saltRounds = DEFAULT_SALT_ROUNDS,
  expandedOtpLength = 0,
}: {
  logMeta?: Record<string, unknown>
  saltRounds?: number
  expandedOtpLength?: number
} = {}): ResultAsync<
  {
    otp: string
    hashedOtp: string
    otpPrefix: string
  },
  HashingError
> => {
  const otp = generateOtp(expandedOtpLength)
  const otpPrefix = generateOtpPrefix()
  return hashData(otp, logMeta, saltRounds).map((hashedOtp) => ({
    otp,
    hashedOtp,
    otpPrefix,
  }))
}
