import { IVerificationFieldSchema, IVerificationSchema } from '../../../types'

export type Transaction =
  | {
      transactionId: IVerificationSchema['_id']
      expireAt: IVerificationSchema['expireAt']
    }
  | Record<string, never>

type SharedSendOtpParams = {
  recipient: string
  otp: string
  hashedOtp: string
  otpPrefix: string
  senderIp: string
}

export type SendFormOtpParams = SharedSendOtpParams & {
  transactionId: string
  fieldId: string
}

export type SendPaymentOtpParams = SharedSendOtpParams & {
  transactionId: string
}

export type SendOtpWithTransactionParams = SharedSendOtpParams & {
  field: IVerificationFieldSchema
  transaction: IVerificationSchema
}
