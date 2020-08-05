import { Document } from 'mongoose'

export interface IFormStatisticsTotal {
  totalCount: number
  lastSubmission: Date
  _id: Document['_id']
}

export interface IFormStatisticsTotalSchema
  extends IFormStatisticsTotal,
    Document {}
