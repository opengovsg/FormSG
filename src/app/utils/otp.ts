import crypto from 'crypto'
import { ResultAsync } from 'neverthrow'

import { hashData, HashingError } from './hash'

const DEFAULT_SALT_ROUNDS = 1

/**
 * Randomly generates and returns a 6 digit OTP.
 * @returns 6 digit OTP string
 */
export const generateOtp = (): string => {
  // Generates cryptographically strong pseudo-random data.
  return Array(6)
    .fill(0)
    .map(() => crypto.randomInt(0, 10))
    .join('')
}

/**
 * Generates a 6-digit OTP together with its hash.
 * @param logMeta Metadata to be included in logs. Defaults to empty object.
 * @param saltRounds Number of salt rounds to use when hashing. Defaults to 10.
 * @returns ok({ otp, hashedOtp }) if OTP generation and hashing are successful
 * @returns err(HashingError) if error occurs while hashing
 */
export const generateOtpWithHash = (
  logMeta: Record<string, unknown> = {},
  saltRounds = DEFAULT_SALT_ROUNDS,
): ResultAsync<
  {
    otp: string
    hashedOtp: string
  },
  HashingError
> => {
  const otp = generateOtp()
  return hashData(otp, logMeta, saltRounds).map((hashedOtp) => ({
    otp,
    hashedOtp,
  }))
}
