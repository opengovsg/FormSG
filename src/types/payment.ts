import { Model } from 'mongoose'

import { Payment } from '../../shared/types/payment'

export type IPaymentSchema = Payment

export type IPaymentModel = Model<IPaymentSchema>
