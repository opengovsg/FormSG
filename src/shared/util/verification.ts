import { BasicField } from '../../types'

export const VERIFIED_FIELDTYPES = [BasicField.Email, BasicField.Mobile]
export const SALT_ROUNDS = 10
export const TRANSACTION_EXPIRE_AFTER_SECONDS = 14400 // 4 hours
export const HASH_EXPIRE_AFTER_SECONDS = 600 // 10 minutes
export const WAIT_FOR_OTP_SECONDS = 30
export const NUM_OTP_RETRIES = 4

export enum VfnErrors {
  ResendOtp = 'RESEND_OTP',
  SendOtpFailed = 'SEND_OTP_FAILED',
  WaitForOtp = 'WAIT_FOR_OTP',
  InvalidOtp = 'INVALID_OTP',
  FieldNotFound = 'FIELD_NOT_FOUND',
  TransactionNotFound = 'TRANSACTION_NOT_FOUND',
  InvalidMobileNumber = 'INVALID_MOBILE_NUMBER',
}
