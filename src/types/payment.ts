import { Model } from 'mongoose'
import { Payment } from 'shared/types/payment'

export type IPaymentSchema = Payment

export type IPaymentModel = Model<IPaymentSchema>

export interface IStripeWebhookBody {
  SmsSid: string
  SmsStatus: string
  MessageStatus: string
  To: string
  MessageSid: string
  AccountSid: string
  MessagingServiceSid: string
  From: string
  ApiVersion: string
  ErrorCode?: number // Only filled when it is 'failed' or 'undelivered'
  ErrorMessage?: string // Only filled when it is 'failed' or 'undelivered'
}
