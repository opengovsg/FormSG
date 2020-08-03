import { Document } from 'mongoose'

export interface IFormStatisticsTotal {
  totalCount: number
  lastSubmission: Date
}

export interface IFormStatisticsTotalSchema
  extends IFormStatisticsTotal,
    Document {}
