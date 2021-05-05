import { Mongoose, Schema } from 'mongoose'

import { IFormFeedbackModel, IFormFeedbackSchema } from '@root/types'

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
 * Returns a cursor for all feedback for the form with formId.
 * @param formId the form id to return the submissions cursor for
 * @returns a cursor to the feedback retrieved
 */
const getFeedbackCursorByFormId: IFormFeedbackModel['getFeedbackCursorByFormId'] = function (
  this: IFormFeedbackModel,
  formId,
) {
  return this.find({ formId }).batchSize(2000).read('secondary').lean().cursor()
}

FormFeedbackSchema.statics.getFeedbackCursorByFormId = getFeedbackCursorByFormId

/**
 * Form Feedback Schema
 * @param db Active DB Connection
 * @return Mongoose Model
 */
const getFormFeedbackModel = (db: Mongoose): IFormFeedbackModel => {
  try {
    return db.model(FORM_FEEDBACK_SCHEMA_ID) as IFormFeedbackModel
  } catch {
    return db.model<IFormFeedbackSchema>(
      FORM_FEEDBACK_SCHEMA_ID,
      FormFeedbackSchema,
      FORM_FEEDBACK_COLLECTION_NAME,
    ) as IFormFeedbackModel
  }
}

export default getFormFeedbackModel
