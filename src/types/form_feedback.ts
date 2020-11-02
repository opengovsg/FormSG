import { Document, Model } from 'mongoose'

import { IFormSchema } from './form'

export interface IFormFeedback {
  formId: IFormSchema['_id']
  rating: number
  comment: string
  _id?: Document['_id']
}

export interface IFormFeedbackSchema extends IFormFeedback, Document {
  _id: Document['_id']
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

export type IFormFeedbackModel = Model<IFormFeedbackSchema>
