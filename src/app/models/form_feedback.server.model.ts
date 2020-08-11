import { Model, Mongoose, Schema } from 'mongoose'

import { IFormFeedbackSchema } from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'

export const FORM_FEEDBACK_SCHEMA_ID = 'FormFeedback'
export const FORM_FEEDBACK_COLLECTION_NAME = 'formfeedback'

const FormFeedbackSchema = new Schema<IFormFeedbackSchema>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
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
 * Form Feedback Schema
 * @param db Active DB Connection
 * @return Mongoose Model
 */
const getFormFeedbackModel = (db: Mongoose) => {
  try {
    return db.model(FORM_FEEDBACK_SCHEMA_ID) as Model<IFormFeedbackSchema>
  } catch {
    return db.model<IFormFeedbackSchema>(
      FORM_FEEDBACK_SCHEMA_ID,
      FormFeedbackSchema,
      FORM_FEEDBACK_COLLECTION_NAME,
    )
  }
}

export default getFormFeedbackModel
