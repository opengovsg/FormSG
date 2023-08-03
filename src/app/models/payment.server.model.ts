import { Mongoose, Schema } from 'mongoose'

import { Payment, PaymentStatus, PaymentType } from '../../../shared/types'
import { IPaymentModel, IPaymentSchema } from '../../types'

import { ProductSchema } from './payments/productSchema'
import { FORM_SCHEMA_ID } from './form.server.model'
import { PENDING_SUBMISSION_SCHEMA_ID } from './pending_submission.server.model'
import { SUBMISSION_SCHEMA_ID } from './submission.server.model'
import { isPositiveInteger } from './utils'

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

    payment_fields_snapshot: {
      enabled: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
        trim: true,
        default: '',
      },
      name: {
        type: String,
        trim: true,
        default: '',
      },
      amount_cents: {
        type: Number,
        default: 0,
        validate: {
          validator: isPositiveInteger,
          message: 'amount_cents must be a non-negative integer.',
        },
      },
      products: [ProductItemSchema],
      products_meta: {
        multi_product: {
          type: Boolean,
          default: false,
        },
      },
      min_amount: {
        type: Number,
        default: 0,
        validate: {
          validator: isPositiveInteger,
          message: 'min_amount must be a non-negative integer.',
        },
      },
      max_amount: {
        type: Number,
        default: 0,
        validate: {
          validator: isPositiveInteger,
          message: 'max_amount must be a non-negative integer.',
        },
      },
      payment_type: {
        type: String,
        enum: Object.values(PaymentType),
        default: PaymentType.Fixed,
      },
      gst_enabled: {
        type: Boolean,
        default: true,
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
