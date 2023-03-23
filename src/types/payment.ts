import { Document, Model } from 'mongoose'

import { Payment } from '../../shared/types/payment'

export interface IPaymentSchema extends Payment, Document {}

export type IPaymentModel = Model<IPaymentSchema>
