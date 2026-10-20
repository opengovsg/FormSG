import { AnalyticsEventType } from 'formsg-shared/types'
import { Document, Model } from 'mongoose'

import { IFormSchema } from './form'
import { IUserSchema } from './user'

export interface IAnalyticsEvent {
  type: AnalyticsEventType
  form: IFormSchema['_id']
  admin: IUserSchema['_id']
  content: Record<string, unknown>
}

export interface IAnalyticsEventSchema extends IAnalyticsEvent, Document {
  created?: Date
}

export type IAnalyticsEventModel = Model<IAnalyticsEventSchema>
