import moment from 'moment-timezone'
import mongoose, {
  Cursor as QueryCursor,
  Mongoose,
  QueryOptions,
  Schema,
} from 'mongoose'

import {
  FormAuthType,
  MyInfoAttribute,
  SubmissionMetadata,
  SubmissionType,
  WebhookResponse,
} from '../../../shared/types'
import {
  FindFormsWithSubsAboveResult,
  IEmailSubmissionModel,
  IEmailSubmissionSchema,
  IEncryptedSubmissionSchema,
  IEncryptSubmissionModel,
  IMultirespondentSubmissionModel,
  IMultirespondentSubmissionSchema,
  IPaymentSchema,
  IPopulatedWebhookSubmission,
  ISubmissionModel,
  ISubmissionSchema,
  IWebhookResponseSchema,
  MultirespondentSubmissionCursorData,
  MultirespondentSubmissionData,
  StorageModeSubmissionCursorData,
  StorageModeSubmissionData,
  SubmissionWebhookInfo,
  WebhookData,
  WebhookView,
} from '../../types'
import { getPaymentWebhookEventObject } from '../modules/payments/payment.service.utils'
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
    submitterId: {
      type: String,
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

/**
 * Creates a new email submission only if provided submitterId is unique.
 * This method ensures that isSingleSubmission is enforced.
 * @param submitterId uniquely identifies the submitter
 * @returns created submission if successful, null otherwise
 */
SubmissionSchema.statics.saveIfSubmitterIdIsUnique = async function (
  formId,
  submitterId,
  submissionContent,
) {
  const session = await this.startSession()
  session.startTransaction()
  const beforeCreateRes = await this.exists({
    form: formId,
    submitterId,
  })
    .setOptions({ readPreference: 'primary' })
    .session(session)
    .exec()
  if (beforeCreateRes) {
    await session.abortTransaction()
    await session.endSession()
    return null
  }

  await this.create([submissionContent], { session })

  const afterCreateRes = await this.find({ form: formId, submitterId }, null, {
    limit: 2,
    readPreference: 'primary',
  })
    .session(session)
    .exec()
  if (afterCreateRes.length > 1) {
    await session.abortTransaction()
    await session.endSession()
    return null
  }

  await session.commitTransaction()
  await session.endSession()
  return afterCreateRes[0]
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
EmailSubmissionSchema.methods.getWebhookView = function (): Promise<null> {
  return Promise.resolve(null)
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
EncryptSubmissionSchema.methods.getWebhookView = async function (
  this: IEncryptedSubmissionSchema | IPopulatedWebhookSubmission,
): Promise<WebhookView> {
  const formId = this.populated('form')
    ? String((this as IPopulatedWebhookSubmission).form._id)
    : String(this.form)
  const attachmentRecords = Object.fromEntries(
    this.attachmentMetadata ?? new Map(),
  )

  if (this.paymentId) {
    await (this as IPopulatedWebhookSubmission).populate('paymentId')
  }
  const paymentContent = this.populated('paymentId')
    ? getPaymentWebhookEventObject(this.paymentId)
    : {}

  const webhookData: WebhookData = {
    formId,
    submissionId: String(this._id),
    encryptedContent: this.encryptedContent,
    verifiedContent: this.verifiedContent,
    version: this.version,
    created: this.created,
    attachmentDownloadUrls: attachmentRecords,
    paymentContent,
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
    .populate([{ path: 'form', select: 'webhook' }, { path: 'paymentId' }])
    .then((populatedSubmission: IPopulatedWebhookSubmission | null) => {
      if (!populatedSubmission) return null
      const webhookView = populatedSubmission.getWebhookView()
      return Promise.all([populatedSubmission, webhookView])
    })
    .then((arr) => {
      if (!arr) return null
      const [populatedSubmission, webhookView] = arr
      return {
        webhookUrl: populatedSubmission.form.webhook?.url ?? '',
        isRetryEnabled: !!populatedSubmission.form.webhook?.isRetryEnabled,
        webhookView,
      }
    })
}

EncryptSubmissionSchema.statics.findSingleMetadata = function (
  formId: string,
  submissionId: string,
): Promise<SubmissionMetadata | null> {
  const pageResults: Promise<MetadataAggregateResult[]> = this.aggregate([
    {
      $match: {
        submissionType: SubmissionType.Encrypt,
        form: new mongoose.Types.ObjectId(formId),
        _id: new mongoose.Types.ObjectId(submissionId),
      },
    },
    { $limit: 1 },
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
  ]).exec()

  return Promise.resolve(pageResults).then((results) => {
    if (!results || results.length <= 0) {
      return null
    }

    const result = results[0]
    const paymentMeta = result.payments?.[0]

    // Build submissionMetadata object.
    const metadata = buildSubmissionMetadata(result, 1, paymentMeta)

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
  metadata: SubmissionMetadata[]
  count: number
}> {
  const numToSkip = (page - 1) * pageSize
  // return documents within the page
  const pageResults: Promise<MetadataAggregateResult[]> = this.aggregate([
    { $match: { form: new mongoose.Types.ObjectId(formId) } },
    { $sort: { created: -1 } },
    { $skip: numToSkip },
    { $limit: pageSize },
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
  ]).exec()

  const count =
    this.countDocuments({
      form: new mongoose.Types.ObjectId(formId),
      submissionType: SubmissionType.Encrypt,
    }).exec() ?? 0

  return Promise.all([pageResults, count]).then(([results, count]) => {
    let currentNumber = count - numToSkip

    const metadata = results.map((result) => {
      const paymentMeta = result.payments?.[0]
      const metadataEntry = buildSubmissionMetadata(
        result,
        currentNumber,
        paymentMeta,
      )

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
): QueryCursor<
  StorageModeSubmissionCursorData,
  QueryOptions<IEncryptedSubmissionSchema>
> {
  const streamQuery = {
    form: formId,
    ...createQueryWithDateParam(dateRange?.startDate, dateRange?.endDate),
  }
  return (
    this.find(streamQuery)
      .select({
        submissionType: 1,
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
      .cursor() as QueryCursor<
      StorageModeSubmissionCursorData,
      QueryOptions<IEncryptedSubmissionSchema>
    >
  )
}

EncryptSubmissionSchema.statics.findEncryptedSubmissionById = function (
  formId: string,
  submissionId: string,
): Promise<StorageModeSubmissionData | null> {
  return this.findOne({
    _id: submissionId,
    form: formId,
    submissionType: SubmissionType.Encrypt,
  })
    .select({
      submissionType: 1,
      encryptedContent: 1,
      verifiedContent: 1,
      attachmentMetadata: 1,
      paymentId: 1,
      created: 1,
      version: 1,
    })
    .exec()
}

export const MultirespondentSubmissionSchema = new Schema<
  IMultirespondentSubmissionSchema,
  IMultirespondentSubmissionModel
>({
  //TODO(MRF/FRM-1592): Clean this up
  form_fields: [],
  form_logics: [],
  workflow: [],

  submissionPublicKey: {
    type: String,
    trim: true,
    required: true,
  },
  encryptedSubmissionSecretKey: {
    type: String,
    trim: true,
    required: true,
  },
  encryptedContent: {
    type: String,
    trim: true,
    required: true,
  },
  attachmentMetadata: {
    type: Map,
    of: String,
  },
  version: {
    type: Number,
    required: true,
  },
  workflowStep: {
    type: Number,
    required: true,
  },
  mrfVersion: {
    type: Number,
  },
})

MultirespondentSubmissionSchema.statics.findSingleMetadata = function (
  formId: string,
  submissionId: string,
): Promise<SubmissionMetadata | null> {
  const pageResults: Promise<MetadataAggregateResult[]> = this.aggregate([
    {
      $match: {
        submissionType: SubmissionType.Multirespondent,
        form: new mongoose.Types.ObjectId(formId),
        _id: new mongoose.Types.ObjectId(submissionId),
      },
    },
    { $limit: 1 },
  ]).exec()

  return Promise.resolve(pageResults).then((results) => {
    if (!results || results.length <= 0) {
      return null
    }

    const result = results[0]

    // Build submissionMetadata object.
    const metadata = buildSubmissionMetadata(result, 1)

    return metadata
  })
}

MultirespondentSubmissionSchema.statics.findAllMetadataByFormId = function (
  formId: string,
  {
    page = 1,
    pageSize = 10,
  }: {
    page?: number
    pageSize?: number
  } = {},
): Promise<{
  metadata: SubmissionMetadata[]
  count: number
}> {
  const numToSkip = (page - 1) * pageSize
  // return documents within the page
  const pageResults: Promise<MetadataAggregateResult[]> = this.aggregate([
    { $match: { form: new mongoose.Types.ObjectId(formId) } },
    { $sort: { created: -1 } },
    { $skip: numToSkip },
    { $limit: pageSize },
    {
      $project: {
        _id: 1,
        created: 1,
      },
    },
  ]).exec()

  const count =
    this.countDocuments({
      form: new mongoose.Types.ObjectId(formId),
      submissionType: SubmissionType.Multirespondent,
    }).exec() ?? 0

  return Promise.all([pageResults, count]).then(([results, count]) => {
    let currentNumber = count - numToSkip

    const metadata = results.map((result) => {
      const paymentMeta = result.payments?.[0]
      const metadataEntry = buildSubmissionMetadata(
        result,
        currentNumber,
        paymentMeta,
      )

      currentNumber--
      return metadataEntry
    })

    return {
      metadata,
      count,
    }
  })
}

MultirespondentSubmissionSchema.statics.getSubmissionCursorByFormId = function (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): QueryCursor<
  MultirespondentSubmissionCursorData,
  QueryOptions<IEncryptedSubmissionSchema>
> {
  const streamQuery = {
    form: formId,
    ...createQueryWithDateParam(dateRange?.startDate, dateRange?.endDate),
  }
  return (
    this.find(streamQuery)
      .select({
        submissionType: 1,
        form_fields: 1,
        form_logics: 1,
        workflow: 1,
        encryptedSubmissionSecretKey: 1,
        encryptedContent: 1,
        attachmentMetadata: 1,
        created: 1,
        version: 1,
        mrfVersion: 1,
        id: 1,
      })
      .batchSize(2000)
      .read('secondary')
      .lean()
      // Override typing as Map is converted to Object once passed through `lean()`.
      .cursor() as QueryCursor<
      MultirespondentSubmissionCursorData,
      QueryOptions<IEncryptedSubmissionSchema>
    >
  )
}

MultirespondentSubmissionSchema.statics.findEncryptedSubmissionById = function (
  formId: string,
  submissionId: string,
): Promise<MultirespondentSubmissionData | null> {
  return this.findOne({
    _id: submissionId,
    form: formId,
    submissionType: SubmissionType.Multirespondent,
  })
    .select({
      submissionType: 1,
      form_fields: 1,
      form_logics: 1,
      workflow: 1,
      submissionPublicKey: 1,
      encryptedSubmissionSecretKey: 1,
      encryptedContent: 1,
      attachmentMetadata: 1,
      created: 1,
      version: 1,
      workflowStep: 1,
      mrfVersion: 1,
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
  Submission.discriminator(
    SubmissionType.Multirespondent,
    MultirespondentSubmissionSchema,
  )
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

export const getMultirespondentSubmissionModel = (
  db: Mongoose,
): IMultirespondentSubmissionModel => {
  getSubmissionModel(db)
  return db.model<
    IMultirespondentSubmissionSchema,
    IMultirespondentSubmissionModel
  >(SubmissionType.Multirespondent)
}

const buildSubmissionMetadata = (
  result: MetadataAggregateResult,
  currentNumber: number,
  paymentMeta?: PaymentAggregates,
): SubmissionMetadata => {
  return {
    number: currentNumber,
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
          transactionFee: paymentMeta.completedPayment?.transactionFee ?? null,
          email: paymentMeta.email,
        }
      : null,
  }
}

export default getSubmissionModel
