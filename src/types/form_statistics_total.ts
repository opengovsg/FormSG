import { Document, Model } from 'mongoose'

export interface IFormStatisticsTotal {
  totalCount: number
  lastSubmission: Date
  _id: Document['_id']
}

export interface IFormStatisticsTotalSchema
  extends IFormStatisticsTotal,
    Document {}

export type AggregateFormCountResult = [
  { numActiveForms: number } | undefined,
  never,
]
export interface IFormStatisticsTotalModel
  extends Model<IFormStatisticsTotalSchema> {
  aggregateFormCount(minSubCount: number): Promise<AggregateFormCountResult>
}
