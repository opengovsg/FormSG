import { Mongoose, Schema } from 'mongoose'

import { Payment, PaymentStatus } from '../../../shared/types'
import { IPaymentModel, IPaymentSchema } from '../../types'

import { ProductSchema } from './payments/productSchema'
import { FORM_SCHEMA_ID, formPaymentsFieldSchema } from './form.server.model'
import { PENDING_SUBMISSION_SCHEMA_ID } from './pending_submission.server.model'
import { SUBMISSION_SCHEMA_ID } from './submission.server.model'

export const PAYMENT_SCHEMA_ID = 'Payment'

const PaymentSchema = new Schema<IPaymentSchema, IPaymentModel>(
  {
    pendingSubmissionId: {
      type: Schema.Types.ObjectId,
      // Defer loading of the ref due to circular dependency on schema IDs.
      ref: () => PENDING_SUBMISSION_SCHEMA_ID,
      required: true,
    },
    formId: {
      type: Schema.Types.ObjectId,
      ref: () => FORM_SCHEMA_ID,
      required: true,
    },
    targetAccountId: {
      type: String,
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
    gstEnabled: {
      type: Boolean,
      required: true,
    },
    responses: [],

    webhookLog: [],
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
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
          // Defer loading of the ref due to circular dependency on schema IDs.
          ref: () => SUBMISSION_SCHEMA_ID,
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

    products: {
      type: [
        {
          selected: {
            type: Boolean,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          data: ProductSchema,
        },
      ],
    },

    payment_fields_snapshot: { type: formPaymentsFieldSchema },
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
  PaymentSchema.statics.getByStatus = async function (
    ...statuses: Payment['status'][]
  ): Promise<IPaymentSchema[]> {
    return this.find({ status: { $in: statuses } }).exec()
  }

  const PaymentModel = db.model<IPaymentSchema, IPaymentModel>(
    PAYMENT_SCHEMA_ID,
    PaymentSchema,
  )

  return PaymentModel
}

const getPaymentModel = (db: Mongoose): IPaymentModel => {
  try {
    return db.model<IPaymentSchema, IPaymentModel>(PAYMENT_SCHEMA_ID)
  } catch {
    return compilePaymentModel(db)
  }
}

export default getPaymentModel
