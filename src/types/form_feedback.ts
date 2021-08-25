import { Document, Model, QueryCursor } from 'mongoose'
import { Merge } from 'type-fest'

import { FormFeedbackBase } from '../../shared/types'

import { IFormSchema } from './form'

export type IFormFeedback = Merge<
  FormFeedbackBase,
  { formId: IFormSchema['_id'] }
>
export interface IFormFeedbackSchema extends IFormFeedback, Document {
  created?: Date
  lastModified?: Date
}

export interface IFormFeedbackDocument extends IFormFeedbackSchema {
  created: Date
  lastModified: Date
}

export interface IFormFeedbackModel extends Model<IFormFeedbackSchema> {
  /**
   * Returns a cursor for all feedback for the form with formId.
   * @param formId the form id to return the submissions cursor for
   * @returns a cursor to the feedback retrieved
   */
  getFeedbackCursorByFormId(formId: string): QueryCursor<IFormFeedbackSchema>
}
