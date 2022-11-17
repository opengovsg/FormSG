import { Model } from 'mongoose'
import { Payment } from 'shared/types/payment'

export type IPaymentSchema = Payment

export type IPaymentModel = Model<IPaymentSchema>

export interface IStripeEventWebhookBody {
  id: string
  api_version: string
  data: {
    object: Record<string, any>
    previous_attributes: Record<string, any>
  }
  request: {
    id: string
    idempotency_key: string
  }
  type: string
  object: string
  account: string
  created: number
  livemode: boolean
  pending_webhooks: number
}
