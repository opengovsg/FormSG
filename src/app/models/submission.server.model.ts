import { Model, Mongoose, Schema } from 'mongoose'

import {
  AuthType,
  IEmailSubmissionModel,
  IEmailSubmissionSchema,
  IEncryptedSubmissionSchema,
  IEncryptSubmissionModel,
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

// Instance methods

const emailSubmissionSchema = new Schema<IEmailSubmissionSchema>({
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

/**
 * Returns null as email submission does not have a webhook view
 */
emailSubmissionSchema.methods.getWebhookView = function (): null {
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

const encryptSubmissionSchema = new Schema<IEncryptedSubmissionSchema>({
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
encryptSubmissionSchema.methods.getWebhookView = function (
  this: ISubmissionSchema,
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

const compileSubmissionModel = (db: Mongoose) => {
  const Submission = db.model('Submission', SubmissionSchema)
  Submission.discriminator(SubmissionType.Email, emailSubmissionSchema)
  Submission.discriminator(SubmissionType.Encrypt, encryptSubmissionSchema)
  return db.model<ISubmissionSchema>(SUBMISSION_SCHEMA_ID, SubmissionSchema)
}

const getSubmissionModel = (db: Mongoose) => {
  try {
    return db.model(SUBMISSION_SCHEMA_ID) as Model<ISubmissionSchema>
  } catch {
    return compileSubmissionModel(db)
  }
}

export const getEmailSubmissionModel = (db: Mongoose) => {
  getSubmissionModel(db)
  return db.model(SubmissionType.Email) as IEmailSubmissionModel
}

export const getEncryptSubmissionModel = (db: Mongoose) => {
  getSubmissionModel(db)
  return db.model(SubmissionType.Encrypt) as IEncryptSubmissionModel
}

export default getSubmissionModel
