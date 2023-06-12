import { Document, Model } from 'mongoose'
import { AdminFeedbackBase } from 'shared/types'
import { Merge } from 'type-fest'

import { IUserSchema } from './user'

export type IAdminFeedback = Merge<
  AdminFeedbackBase,
  { adminId: IUserSchema['_id'] }
>
export interface IAdminFeedbackSchema extends IAdminFeedback, Document {
  created?: Date
  lastModified?: Date
}

export interface IAdminFeedbackModel extends Model<IAdminFeedbackSchema> {
  updateAdminFeedback(
    feedbackId: string,
    comment?: string,
    rating?: number,
  ): Promise<IAdminFeedbackSchema>
}
