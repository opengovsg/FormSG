import moment from 'moment-timezone'
import mongoose, { Mongoose, QueryCursor, Schema } from 'mongoose'

import {
  FormAuthType,
  MyInfoAttribute,
  StorageModeSubmissionMetadata,
  SubmissionType,
  WebhookResponse,
} from '../../../shared/types'
import {
  FindFormsWithSubsAboveResult,
  IEmailSubmissionModel,
  IEmailSubmissionSchema,
  IEncryptedSubmissionSchema,
  IEncryptSubmissionModel,
  IPaymentSchema,
  IPopulatedWebhookSubmission,
  ISubmissionModel,
  ISubmissionSchema,
  IWebhookResponseSchema,
  SubmissionCursorData,
  SubmissionData,
  SubmissionWebhookInfo,
  WebhookData,
  WebhookView,
} from '../../types'
import { createQueryWithDateParam } from '../utils/date'

import { FORM_SCHEMA_ID } from './form.server.model'
import { PAYMENT_SCHEMA_ID } from './payment.server.model'

export const SUBMISSION_SCHEMA_ID = 'Submission'

// Exported for use in pending submissions model
export const SubmissionSchema = new Schema<ISubmissionSchema, ISubmissionModel>(
  {
    form: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    authType: {
      type: String,
      enum: Object.values(FormAuthType),
      default: FormAuthType.NIL,
    },
    myInfoFields: {
      type: [
        {
          type: String,
          trim: true,
          enum: Object.values(MyInfoAttribute),
        },
      ],
    },
    submissionType: {
      type: String,
      enum: Object.values(SubmissionType),
      required: true,
    },
    responseMetadata: {
      responseTimeMs: {
        type: Number,
      },
      numVisibleFields: {
        type: Number,
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'lastModified',
    },
    discriminatorKey: 'submissionType',
    read: 'secondary',
  },
)

SubmissionSchema.index({
  form: 1,
  submissionType: 1,
  created: -1,
})

// Base schema static methods
SubmissionSchema.statics.findFormsWithSubsAbove = function (
  minSubCount: number,
): Promise<FindFormsWithSubsAboveResult[]> {
  return this.aggregate<FindFormsWithSubsAboveResult>([
    {
      $group: {
        _id: '$form',
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: {
          $gt: minSubCount,
        },
      },
    },
  ]).exec()
}

// Exported for use in pending submissions model
export const EmailSubmissionSchema = new Schema<IEmailSubmissionSchema>({
  recipientEmails: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  responseHash: {
    type: String,
    trim: true,
    required: true,
  },
  responseSalt: {
    type: String,
    trim: true,
    required: true,
  },
  hasBounced: {
    type: Boolean,
    default: false,
  },
})

// EmailSubmission Instance methods
/**
 * Returns null as email submission does not have a webhook view
 */
EmailSubmissionSchema.methods.getWebhookView = function (): null {
  return null
}

const webhookResponseSchema = new Schema<IWebhookResponseSchema>(
  {
    webhookUrl: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    response: {
      status: {
        type: Number,
        required: true,
      },
      headers: String,
      data: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: false,
    },
  },
)

// Exported for use in pending submissions model
export const EncryptSubmissionSchema = new Schema<
  IEncryptedSubmissionSchema,
  IEncryptSubmissionModel
>({
  encryptedContent: {
    type: String,
    trim: true,
    required: true,
  },
  verifiedContent: {
    type: String,
    trim: true,
  },
  attachmentMetadata: {
    type: Map,
    of: String,
  },
  version: {
    type: Number,
    required: true,
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    // Defer loading of the ref due to circular dependency on schema IDs.
    ref: () => PAYMENT_SCHEMA_ID,
  },
  webhookResponses: [webhookResponseSchema],
})

/**
 * Returns an object which represents the encrypted submission
 * which will be posted to the webhook URL.
 */
EncryptSubmissionSchema.methods.getWebhookView = function (
  this: IEncryptedSubmissionSchema | IPopulatedWebhookSubmission,
): WebhookView {
  const formId = this.populated('form')
    ? String((this as IPopulatedWebhookSubmission).form._id)
    : String(this.form)
  const attachmentRecords = Object.fromEntries(
    this.attachmentMetadata ?? new Map(),
  )

  const webhookData: WebhookData = {
    formId,
    submissionId: String(this._id),
    encryptedContent: this.encryptedContent,
    verifiedContent: this.verifiedContent,
    version: this.version,
    created: this.created,
    attachmentDownloadUrls: attachmentRecords,
  }

  return {
    data: webhookData,
  }
}

EncryptSubmissionSchema.statics.addWebhookResponse = function (
  submissionId: string,
  webhookResponse: WebhookResponse,
): Promise<IEncryptedSubmissionSchema | null> {
  return this.findByIdAndUpdate(
    submissionId,
    { $push: { webhookResponses: webhookResponse } },
    { new: true, setDefaultsOnInsert: true, runValidators: true },
  ).exec()
}

EncryptSubmissionSchema.statics.retrieveWebhookInfoById = function (
  this: IEncryptSubmissionModel,
  submissionId: string,
): Promise<SubmissionWebhookInfo | null> {
  return this.findById(submissionId)
    .populate('form', 'webhook')
    .then((populatedSubmission: IPopulatedWebhookSubmission | null) => {
      if (!populatedSubmission) return null
      return {
        webhookUrl: populatedSubmission.form.webhook?.url ?? '',
        isRetryEnabled: !!populatedSubmission.form.webhook?.isRetryEnabled,
        webhookView: populatedSubmission.getWebhookView(),
      }
    })
}

EncryptSubmissionSchema.statics.findSingleMetadata = function (
  formId: string,
  submissionId: string,
): Promise<StorageModeSubmissionMetadata | null> {
  const pageResults: Promise<MetadataAggregateResult[]> = this.aggregate([
    {
      $match: {
        form: mongoose.Types.ObjectId(formId),
        _id: mongoose.Types.ObjectId(submissionId),
        submissionType: SubmissionType.Encrypt,
      },
    },
    {
      $lookup: {
        from: 'payments',
        localField: 'paymentId',
        foreignField: '_id',
        as: 'payments',
      },
    },
    {
      $project: {
        _id: 1,
        created: 1,
        'payments.payout': 1,
        'payments.completedPayment': 1,
        'payments.amount': 1,
        'payments.email': 1,
      },
    },
  ])
    .limit(1)
    .exec()

  return Promise.resolve(pageResults).then((results) => {
    if (!results || results.length <= 0) {
      return null
    }

    const result = results[0]
    const paymentMeta = result.payments?.[0]

    // Build submissionMetadata object.
    const metadata: StorageModeSubmissionMetadata = {
      number: 1,
      refNo: result._id,
      submissionTime: moment(result.created)
        .tz('Asia/Singapore')
        .format('Do MMM YYYY, h:mm:ss a'),
      payments: paymentMeta
        ? {
            payoutDate: paymentMeta.payout
              ? moment(paymentMeta.payout.payoutDate)
                  .tz('Asia/Singapore')
                  .format('ddd, D MMM YYYY')
              : null,

            paymentAmt: paymentMeta.amount,
            transactionFee:
              paymentMeta.completedPayment?.transactionFee ?? null,
            email: paymentMeta.email,
          }
        : null,
    }

    return metadata
  })
}

/**
 * Unexported as the type is only used in {@see findAllMetadataByFormId} for
 * now.
 */
type MetadataAggregateResult = Pick<ISubmissionSchema, '_id' | 'created'> & {
  payments?: PaymentAggregates[]
}
type PaymentAggregates = Pick<
  IPaymentSchema,
  'amount' | 'payout' | 'completedPayment' | 'email'
>

EncryptSubmissionSchema.statics.findAllMetadataByFormId = function (
  formId: string,
  {
    page = 1,
    pageSize = 10,
  }: {
    page?: number
    pageSize?: number
  } = {},
): Promise<{
  metadata: StorageModeSubmissionMetadata[]
  count: number
}> {
  const numToSkip = (page - 1) * pageSize
  // return documents within the page
  const pageResults: Promise<MetadataAggregateResult[]> = this.aggregate([
    {
      $match: {
        form: mongoose.Types.ObjectId(formId),
        submissionType: SubmissionType.Encrypt,
      },
    },
    {
      $lookup: {
        from: 'payments',
        localField: 'paymentId',
        foreignField: '_id',
        as: 'payments',
      },
    },
    {
      $project: {
        _id: 1,
        created: 1,
        'payments.payout': 1,
        'payments.completedPayment': 1,
        'payments.amount': 1,
        'payments.email': 1,
      },
    },
  ])
    .sort({ created: -1 })
    .skip(numToSkip)
    .limit(pageSize)
    .exec()

  const count =
    this.countDocuments({
      form: mongoose.Types.ObjectId(formId),
      submissionType: SubmissionType.Encrypt,
    }).exec() ?? 0

  return Promise.all([pageResults, count]).then(([result, count]) => {
    let currentNumber = count - numToSkip

    const metadata = result.map((data) => {
      const paymentMeta = data.payments?.[0]
      const metadataEntry: StorageModeSubmissionMetadata = {
        number: currentNumber,
        refNo: data._id,
        submissionTime: moment(data.created)
          .tz('Asia/Singapore')
          .format('Do MMM YYYY, h:mm:ss a'),
        payments: paymentMeta
          ? {
              payoutDate: paymentMeta.payout
                ? moment(paymentMeta.payout.payoutDate)
                    .tz('Asia/Singapore')
                    .format('ddd, D MMM YYYY')
                : null,

              paymentAmt: paymentMeta.amount,
              transactionFee:
                paymentMeta.completedPayment?.transactionFee ?? null,
              email: paymentMeta.email,
            }
          : null,
      }

      currentNumber--
      return metadataEntry
    })

    return {
      metadata,
      count,
    }
  })
}

EncryptSubmissionSchema.statics.getSubmissionCursorByFormId = function (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): QueryCursor<SubmissionCursorData> {
  const streamQuery = {
    form: formId,
    ...createQueryWithDateParam(dateRange?.startDate, dateRange?.endDate),
  }
  return (
    this.find(streamQuery)
      .select({
        encryptedContent: 1,
        verifiedContent: 1,
        attachmentMetadata: 1,
        paymentId: 1,
        created: 1,
        version: 1,
        id: 1,
      })
      .batchSize(2000)
      .read('secondary')
      .lean()
      // Override typing as Map is converted to Object once passed through `lean()`.
      .cursor() as QueryCursor<SubmissionCursorData>
  )
}

EncryptSubmissionSchema.statics.findEncryptedSubmissionById = function (
  formId: string,
  submissionId: string,
): Promise<SubmissionData | null> {
  return this.findOne({
    _id: submissionId,
    form: formId,
    submissionType: SubmissionType.Encrypt,
  })
    .select({
      encryptedContent: 1,
      verifiedContent: 1,
      attachmentMetadata: 1,
      paymentId: 1,
      created: 1,
      version: 1,
    })
    .exec()
}

const compileSubmissionModel = (db: Mongoose): ISubmissionModel => {
  const Submission = db.model<ISubmissionSchema, ISubmissionModel>(
    SUBMISSION_SCHEMA_ID,
    SubmissionSchema,
  )
  Submission.discriminator(SubmissionType.Email, EmailSubmissionSchema)
  Submission.discriminator(SubmissionType.Encrypt, EncryptSubmissionSchema)
  return db.model<ISubmissionSchema, ISubmissionModel>(
    SUBMISSION_SCHEMA_ID,
    SubmissionSchema,
  )
}

const getSubmissionModel = (db: Mongoose): ISubmissionModel => {
  try {
    return db.model<ISubmissionSchema, ISubmissionModel>(SUBMISSION_SCHEMA_ID)
  } catch {
    return compileSubmissionModel(db)
  }
}

export const getEmailSubmissionModel = (
  db: Mongoose,
): IEmailSubmissionModel => {
  getSubmissionModel(db)
  return db.model<IEmailSubmissionSchema, IEmailSubmissionModel>(
    SubmissionType.Email,
  )
}

export const getEncryptSubmissionModel = (
  db: Mongoose,
): IEncryptSubmissionModel => {
  getSubmissionModel(db)
  return db.model<IEncryptedSubmissionSchema, IEncryptSubmissionModel>(
    SubmissionType.Encrypt,
  )
}

export default getSubmissionModel
