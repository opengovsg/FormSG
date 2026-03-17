import { AdminFeedbackBase } from 'formsg-shared/types'
import { Document, Model } from 'mongoose'
import { Merge } from 'type-fest'

import { IUserSchema } from './user'

export type IAdminFeedback = Merge<
  AdminFeedbackBase,
  { userId: IUserSchema['_id'] }
>
export interface IAdminFeedbackSchema extends IAdminFeedback, Document {
  created?: Date
  lastModified?: Date
}

export type IAdminFeedbackModel = Model<IAdminFeedbackSchema>
