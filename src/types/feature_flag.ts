import { Model } from 'mongoose'

export interface IFeatureFlagSchema {
  name: string
  enabled: boolean
}

export interface IFeatureFlagModel extends Model<IFeatureFlagSchema> {
  findFlag: (flag: string) => Promise<IFeatureFlagSchema>
}
