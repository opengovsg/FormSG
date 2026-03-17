import { BasicField } from '../types/field'

export const VERIFIED_FIELDTYPES = [BasicField.Email, BasicField.Mobile]
export const SALT_ROUNDS = 1
export const TRANSACTION_EXPIRE_AFTER_SECONDS = 14400 // 4 hours
export const HASH_EXPIRE_AFTER_SECONDS = 60 * 30 // 30 minutes
export const WAIT_FOR_OTP_SECONDS = 30
export const MAX_OTP_REQUESTS = 10

/**
 * WAIT_FOR_OTP_SECONDS tolerance. Server allows OTPs to be requested every
 * (WAIT_FOR_OTP_SECONDS - WAIT_FOR_OTP_TOLERANCE_SECONDS) seconds.
 */
export const WAIT_FOR_OTP_TOLERANCE_SECONDS = 2
export const NUM_OTP_RETRIES = 4
