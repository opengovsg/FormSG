import { Mongoose, Schema } from 'mongoose'

import { IAdminFeedbackModel, IAdminFeedbackSchema } from '../../types'

import { USER_SCHEMA_ID } from './user.server.model'

// alias of model Id
export const ADMIN_FEEDBACK_COLLECTION_NAME = 'adminFeedback'

const AdminFeedbackSchema = new Schema<
  IAdminFeedbackSchema,
  IAdminFeedbackModel
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: USER_SCHEMA_ID,
      required: true,
    },
    // Legacy thumbs (0/1) key. Optional so new rows can omit it in favour of
    // `csat`. `max` stays at 5 rather than 1 until we can confirm no historical
    // rows exceed 1; the API layer already restricts new writes to 0-1.
    rating: {
      type: Number,
      min: 0,
      max: 5,
      required: false,
    },
    // CSAT: the new 1-5 star satisfaction score. Own key to keep it separate from
    // legacy `rating` data.
    csat: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    comment: {
      type: String,
      required: false,
      trim: true,
    },
    triggerSource: {
      type: String,
      enum: ['field-edit', 'publish', 'workflow'],
    },
    formId: {
      type: Schema.Types.ObjectId,
    },
    ratingChanged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'lastModified',
    },
  },
)

/**
 * Admin Feedback Schema
 * @param db Active DB Connection
 * @return Mongoose Model
 */
const getAdminFeedbackModel = (db: Mongoose): IAdminFeedbackModel => {
  try {
    return db.model<IAdminFeedbackSchema, IAdminFeedbackModel>(
      ADMIN_FEEDBACK_COLLECTION_NAME,
    )
  } catch {
    return db.model<IAdminFeedbackSchema, IAdminFeedbackModel>(
      ADMIN_FEEDBACK_COLLECTION_NAME,
      AdminFeedbackSchema,
      ADMIN_FEEDBACK_COLLECTION_NAME,
    )
  }
}

export default getAdminFeedbackModel
