import { ADMIN_FEEDBACK_TRIGGER_SOURCES } from 'formsg-shared/types'
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
    // Legacy thumbs feedback (0/1). Historical rows only; new rows write `csat`.
    rating: {
      type: Number,
      min: 0,
      max: 1,
      required: false,
    },
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
      enum: [...ADMIN_FEEDBACK_TRIGGER_SOURCES],
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
