import { Document, Model, QueryCursor } from 'mongoose'

import { IFormSchema } from './form'

export interface IFormFeedback {
  formId: IFormSchema['_id']
  rating: number
  comment?: string
}

export interface IFormFeedbackSchema extends IFormFeedback, Document {
  created?: Date
  lastModified?: Date
}
export interface IFormFeedbackDocument extends IFormFeedbackSchema {
  created: Date
  lastModified: Date
}

export interface IFormFeedbackSchema extends Document, IFormFeedback {}

export interface IFormFeedbackDoc extends IFormFeedbackSchema {
  lastModified: Date
  created: Date
}

export interface IFormFeedbackModel extends Model<IFormFeedbackSchema> {
  /**
   * Returns a cursor for all feedback for the form with formId.
   * @param formId the form id to return the submissions cursor for
   * @returns a cursor to the feedback retrieved
   */
  getFeedbackCursorByFormId(formId: string): QueryCursor<IFormFeedbackSchema>
}
