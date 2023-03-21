import { IVerificationSchema } from '../../../types'

export type Transaction =
  | {
      transactionId: IVerificationSchema['_id']
      expireAt: IVerificationSchema['expireAt']
    }
  | Record<string, never>

export type SendOtpParams = {
  transactionId: string
  fieldId: string
  recipient: string
  otp: string
  hashedOtp: string
  otpPrefix: string
  senderIp: string
}
