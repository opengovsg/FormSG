import crypto from 'crypto'
import { OTP_LENGTH } from 'formsg-shared/constants'
import { ResultAsync } from 'neverthrow'

import { hashData, HashingError } from './hash'

const DEFAULT_SALT_ROUNDS = 1

// Uppercase-only so OTPs can be entered case-insensitively; submitted OTPs are
// uppercased before hash comparison.
const OTP_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Randomly generates and returns an uppercase alphanumeric OTP of length
 * {@link OTP_LENGTH}.
 * @returns OTP string
 */
export const generateOtp = (): string => {
  // Generates cryptographically strong pseudo-random data.
  return Array(OTP_LENGTH)
    .fill(0)
    .map(() => OTP_CHARSET[crypto.randomInt(0, OTP_CHARSET.length)])
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
 * @returns ok({ otp, hashedOtp }) if OTP generation and hashing are successful
 * @returns err(HashingError) if error occurs while hashing
 */
export const generateOtpWithHash = ({
  logMeta = {},
  saltRounds = DEFAULT_SALT_ROUNDS,
}: {
  logMeta?: Record<string, unknown>
  saltRounds?: number
} = {}): ResultAsync<
  {
    otp: string
    hashedOtp: string
    otpPrefix: string
  },
  HashingError
> => {
  const otp = generateOtp()
  const otpPrefix = generateOtpPrefix()
  return hashData(otp, logMeta, saltRounds).map((hashedOtp) => ({
    otp,
    hashedOtp,
    otpPrefix,
  }))
}
