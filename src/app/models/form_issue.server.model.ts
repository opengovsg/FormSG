import { Mongoose, QueryCursor, Schema } from 'mongoose'

import {
  FormIssueStreamData,
  IFormIssueModel,
  IFormIssueSchema,
} from 'src/types'

import { FORM_SCHEMA_ID } from './form.server.model'

export const FORM_ISSUE_COLLECTION_NAME = 'formIssue'

const FormIssueSchema = new Schema<IFormIssueSchema, IFormIssueModel>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    issue: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      // Ensure lowercase email addresses are stored in the database.
      set: (v: string) => v.toLowerCase(),
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

FormIssueSchema.index({ formId: 1 })

/**
 * Returns a cursor for all issues for the form with formId.
 * @param formId the form id to return the cursor for
 * @returns a cursor to the issue retrieved
 */
FormIssueSchema.statics.getIssueCursorByFormId = function (
  formId: string,
): QueryCursor<FormIssueStreamData> {
  return this.find({ formId }, { issue: 1, email: 1, created: 1 })
    .batchSize(2000)
    .read('secondaryPreferred')
    .lean()
    .cursor()
}

/**
 * Form issue Schema
 * @param db Active DB Connection
 * @return Mongoose Model
 */
const getFormIssueModel = (db: Mongoose): IFormIssueModel => {
  try {
    return db.model<IFormIssueSchema, IFormIssueModel>(
      FORM_ISSUE_COLLECTION_NAME,
    )
  } catch {
    return db.model<IFormIssueSchema, IFormIssueModel>(
      FORM_ISSUE_COLLECTION_NAME,
      FormIssueSchema,
      FORM_ISSUE_COLLECTION_NAME,
    )
  }
}
export default getFormIssueModel
