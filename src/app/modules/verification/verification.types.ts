import { IVerificationSchema } from '../../../types'

export type Transaction =
  | {
      transactionId: IVerificationSchema['_id']
      expireAt: IVerificationSchema['expireAt']
    }
  | Record<string, never>

export type SendOtpParams = {
  recipient: string
  otp: string
  hashedOtp: string
  otpPrefix: string
  senderIp: string
  transactionId: string
  fieldId: string
}

export type VerifyOtpParams = {
  transactionId: string
  fieldId: string
  inputOtp: string
}

export type ResetFieldForTransactionParams = {
  transactionId: string
  fieldId: string
}
