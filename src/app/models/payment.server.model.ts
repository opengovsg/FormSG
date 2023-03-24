import { Mongoose, Schema } from 'mongoose'

import { PaymentStatus } from '../../../shared/types'
import { IPaymentModel, IPaymentSchema } from '../../types'

import { PENDING_SUBMISSION_SCHEMA_ID } from './pending_submission.server.model'
import { SUBMISSION_SCHEMA_ID } from './submission.server.model'

export const PAYMENT_SCHEMA_ID = 'Payment'

const PaymentSchema = new Schema<IPaymentSchema, IPaymentModel>(
  {
    pendingSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: PENDING_SUBMISSION_SCHEMA_ID,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentIntentId: {
      type: String,
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
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
    },
    chargeIdLatest: {
      type: String,
    },

    completedPayment: {
      type: {
        paymentDate: {
          type: Date,
          required: true,
        },
        submissionId: {
          type: Schema.Types.ObjectId,
          ref: SUBMISSION_SCHEMA_ID,
          required: true,
        },
        transactionFee: {
          type: Number,
          required: true,
        },
        receiptUrl: {
          type: String,
          required: true,
        },
      },
    },

    payout: {
      type: {
        payoutId: {
          type: String,
          required: true,
        },
        payoutDate: {
          type: Date,
          required: true,
        },
      },
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

const compilePaymentModel = (db: Mongoose): IPaymentModel => {
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
