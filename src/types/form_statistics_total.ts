import { Document, Model } from 'mongoose'

import { IFormSchema } from './form'

export interface IFormStatisticsTotal {
  formId: IFormSchema['_id']
  totalCount: number
  lastSubmission: Date
}

export interface IFormStatisticsTotalSchema
  extends IFormStatisticsTotal,
    Document {}

export type AggregateFormCountResult = { numActiveForms: number }[]

export interface IFormStatisticsTotalModel
  extends Model<IFormStatisticsTotalSchema> {
  aggregateFormCount(minSubCount: number): Promise<AggregateFormCountResult>
}
