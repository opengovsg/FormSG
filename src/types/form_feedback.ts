import { Document, Model, QueryCursor } from 'mongoose'

import { IFormSchema } from './form'

export type ProcessedFeedback = {
  index: number
  timestamp: number
  rating: number
  comment: string
  date: string
  dateShort: string
}

export type FeedbackResponse = {
  average?: string
  count: number
  feedback: ProcessedFeedback[]
}

export interface IFormFeedback {
  formId: IFormSchema['_id']
  rating: number
  comment?: string
}

export type FormFeedbackPostDto = Omit<IFormFeedback, 'formId'> & {
  isPreview?: boolean
}

export type FormFeedbackResponseDto = IFormFeedback & {
  created?: Date
  lastModified?: Date
}

export type GetFormFeedbackDto = FeedbackResponse

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
