import { Document } from 'mongoose'

export interface IFormStatisticsTotal {
  totalCount: number
  lastSubmission: Date
  _id: any
}

export interface IFormStatisticsTotalSchema
  extends IFormStatisticsTotal,
    Document {}
