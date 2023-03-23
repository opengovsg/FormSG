import { Mongoose, Schema } from 'mongoose'

import { PaymentStatus } from '../../../shared/types'
import { IPaymentModel, IPaymentSchema } from '../../types'

export const PAYMENT_SCHEMA_ID = 'Payment'

const compilePaymentModel = (db: Mongoose): IPaymentModel => {
  const PaymentSchema = new Schema<IPaymentSchema, IPaymentModel>(
    {
      submissionId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatus),
        required: true,
      },
      webhookLog: {
        type: [
          {
            type: String,
          },
        ],
        default: [],
      },
      paymentIntentId: {
        type: String,
        required: true,
      },
      chargeIdLatest: {
        type: String,
      },
      payoutId: {
        type: String,
      },
      payoutDate: {
        type: Date,
      },
      transactionFee: {
        type: Number,
      },
      receiptUrl: {
        type: String,
      },
      email: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: {
        createdAt: 'created',
        updatedAt: 'lastModified',
      },
      read: 'secondary',
    },
  )

  const PaymentModel = db.model<IPaymentSchema, IPaymentModel>(
    PAYMENT_SCHEMA_ID,
    PaymentSchema,
  )

  return PaymentModel
}

const getPaymentModel = (db: Mongoose): IPaymentModel => {
  try {
    return db.model(PAYMENT_SCHEMA_ID) as IPaymentModel
  } catch {
    return compilePaymentModel(db)
  }
}

export default getPaymentModel
