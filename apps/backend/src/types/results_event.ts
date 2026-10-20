import {
  ResultsDashboardVersion,
  ResultsDownloadFormat,
  ResultsDownloadScope,
  ResultsEventType,
} from 'formsg-shared/types'
import { Document, Model } from 'mongoose'

import { IFormSchema } from './form'
import { IUserSchema } from './user'

export interface IResultsEvent {
  type: ResultsEventType
  form: IFormSchema['_id']
  admin: IUserSchema['_id']
  dashboardVersion?: ResultsDashboardVersion
  formats?: ResultsDownloadFormat[]
  scope?: ResultsDownloadScope
  savedViewId?: string
  isSavedViewModified?: boolean
  savedViewAgeMs?: number
  responsesCount?: number
  from?: ResultsDashboardVersion
  to?: ResultsDashboardVersion
}

export interface IResultsEventSchema extends IResultsEvent, Document {
  created?: Date
}

export type IResultsEventModel = Model<IResultsEventSchema>
