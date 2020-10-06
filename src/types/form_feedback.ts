import { Document } from 'mongoose'

import { IFormSchema } from './form'

export interface IFormFeedback {
  formId: IFormSchema['_id']
  rating: number
  comment?: string
}

export interface IFormFeedbackSchema extends Document, IFormFeedback {}

export interface IFormFeedbackDoc extends IFormFeedbackSchema {
  lastModified: Date
  created: Date
}
