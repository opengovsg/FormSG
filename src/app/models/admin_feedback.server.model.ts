import { Mongoose, Schema } from 'mongoose'

import { IAdminFeedbackModel, IAdminFeedbackSchema } from '../../types'

import { USER_SCHEMA_ID } from './user.server.model'

// also acts as the model Id
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
    rating: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    comment: {
      type: String,
      required: false,
      trim: true,
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
