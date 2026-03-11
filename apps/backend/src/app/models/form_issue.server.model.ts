import { Cursor as QueryCursor, Mongoose, QueryOptions, Schema } from 'mongoose'

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
 * @param fields an array of field names to retrieve
 * @returns a cursor to the issue retrieved
 */
FormIssueSchema.statics.getIssueCursorByFormId = function (
  formId: string,
  fields: (keyof IFormIssueSchema)[],
): QueryCursor<FormIssueStreamData, QueryOptions<IFormIssueSchema>> {
  return this.find({ formId }, fields)
    .batchSize(2000)
    .read('secondary')
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
