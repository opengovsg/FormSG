import { Document, Model } from 'mongoose'

import { IFormSchema } from './form'

export interface IFormFeedback {
  formId: IFormSchema['_id']
  rating: number
  comment: string
  created: Date
  lastModified?: Date
  _id: Document['_id']
}

export type IFormFeedbackSchema = Document
export type IFormFeedbackModel = Model<IFormFeedbackSchema>
