import { IVerificationSchema } from '../../../types'

export type Transaction =
  | {
      transactionId: IVerificationSchema['_id']
      expireAt: IVerificationSchema['expireAt']
    }
  | Record<string, never>

type SharedSendOtpParams = {
  transactionId: string
  recipient: string
  otp: string
  hashedOtp: string
  otpPrefix: string
  senderIp: string
}

export type SendFormOtpParams = SharedSendOtpParams & {
  fieldId: string
}

export type SendPaymentOtpParams = SharedSendOtpParams
