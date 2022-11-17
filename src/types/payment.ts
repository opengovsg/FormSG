import { Model } from 'mongoose'
import { Payment } from 'shared/types/payment'

export type IPaymentSchema = Payment

export type IPaymentModel = Model<IPaymentSchema>

export interface IStripeWebhookBody {
  Id: string
  ApiVersion: string
  Data: {
    Object: Record<string, any>
    PreviousAttributes: Record<string, any>
  }
  Request: {
    Id: string
    IdempotencyKey: string
  }
  Type: string
  Account: string
  Created: Date
  Livemode: boolean
  PendingWebhooks: number
}
