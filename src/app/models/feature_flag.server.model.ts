import { Mongoose, Schema } from 'mongoose'

import { IFeatureFlagModel, IFeatureFlagSchema } from 'src/types/feature_flag'

export const FEATURE_FLAG_SCHEMA_ID = 'featureFlag'

const compileFeatureFlagModel = (db: Mongoose): IFeatureFlagModel => {
  const FeatureFlagSchema = new Schema<IFeatureFlagSchema, IFeatureFlagModel>({
    name: {
      type: Schema.Types.String,
      required: true,
    },
    enabled: {
      type: Schema.Types.Boolean,
      required: true,
    },
  })

  // Statics
  /**
   * Find beta flag document given beta flag name
   */
  FeatureFlagSchema.statics.findFlag = async function (flag: string) {
    return await this.findOne({ name: flag }).exec()
  }

  const GlobalBetaModel = db.model<IFeatureFlagSchema, IFeatureFlagModel>(
    FEATURE_FLAG_SCHEMA_ID,
    FeatureFlagSchema,
  )

  return GlobalBetaModel
}

const getFeatureFlagModel = (db: Mongoose): IFeatureFlagModel => {
  try {
    return db.model<IFeatureFlagSchema, IFeatureFlagModel>(
      FEATURE_FLAG_SCHEMA_ID,
    )
  } catch {
    return compileFeatureFlagModel(db)
  }
}

export default getFeatureFlagModel
