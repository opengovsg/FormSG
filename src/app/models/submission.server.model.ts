import { Model, Mongoose, Schema } from 'mongoose'

import {
  AuthType,
  FindFormsWithSubsAboveResult,
  IEmailSubmissionModel,
  IEmailSubmissionSchema,
  IEncryptedSubmissionSchema,
  IEncryptSubmissionModel,
  IFormSchema,
  ISubmissionModel,
  ISubmissionSchema,
  IWebhookResponseSchema,
  MyInfoAttribute,
  SubmissionType,
  WebhookData,
  WebhookView,
} from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'

export const SUBMISSION_SCHEMA_ID = 'Submission'

const SubmissionSchema = new Schema<ISubmissionSchema>(
  {
    form: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    authType: {
      type: String,
      enum: Object.values(AuthType),
      default: AuthType.NIL,
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
  this: ISubmissionModel,
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

const EmailSubmissionSchema = new Schema<IEmailSubmissionSchema>({
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
    webhookUrl: String,
    signature: String,
    errorMessage: String,
    response: {
      status: Number,
      statusText: String,
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

const EncryptSubmissionSchema = new Schema<IEncryptedSubmissionSchema>({
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
  webhookResponses: [webhookResponseSchema],
})

/**
 * Returns an object which represents the encrypted submission
 * which will be posted to the webhook URL.
 */
EncryptSubmissionSchema.methods.getWebhookView = function (
  this: IEncryptedSubmissionSchema,
): WebhookView {
  const webhookData: WebhookData = {
    formId: String(this.form),
    submissionId: String(this._id),
    encryptedContent: this.encryptedContent,
    verifiedContent: this.verifiedContent,
    version: this.version,
    created: this.created,
  }

  return {
    data: webhookData,
  }
}

const compileSubmissionModel = (db: Mongoose): ISubmissionModel => {
  const Submission = db.model('Submission', SubmissionSchema)
  Submission.discriminator(SubmissionType.Email, EmailSubmissionSchema)
  Submission.discriminator(SubmissionType.Encrypt, EncryptSubmissionSchema)
  return db.model<ISubmissionSchema>(
    SUBMISSION_SCHEMA_ID,
    SubmissionSchema,
  ) as ISubmissionModel
}

const getSubmissionModel = (db: Mongoose): ISubmissionModel => {
  try {
    return db.model(SUBMISSION_SCHEMA_ID) as ISubmissionModel
  } catch {
    return compileSubmissionModel(db)
  }
}

export const getEmailSubmissionModel = (
  db: Mongoose,
): IEmailSubmissionModel => {
  getSubmissionModel(db)
  return db.model(SubmissionType.Email) as IEmailSubmissionModel
}

export const getEncryptSubmissionModel = (
  db: Mongoose,
): IEncryptSubmissionModel => {
  getSubmissionModel(db)
  return db.model(SubmissionType.Encrypt) as IEncryptSubmissionModel
}

export default getSubmissionModel
