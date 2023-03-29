import { IVerificationModel, IVerificationSchema } from '../../../types'

import {
  getFieldFromTransaction,
  getPaymentContactFieldFromTransaction,
} from './verification.util'

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
  getFieldFromTransactionFx:
    | typeof getFieldFromTransaction
    | typeof getPaymentContactFieldFromTransaction
  updateHashFx:
    | IVerificationModel['updateHashForFormField']
    | IVerificationModel['updateHashForPaymentField']
}

export type VerifyOtpParams = {
  transactionId: string
  fieldId: string
  inputOtp: string
  getFieldFromTransactionFx:
    | typeof getFieldFromTransaction
    | typeof getPaymentContactFieldFromTransaction
  incrementFieldRetriesFx:
    | IVerificationModel['incrementFormFieldRetries']
    | IVerificationModel['incrementPaymentFieldRetries']
}
