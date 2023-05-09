import { Mongoose, Schema } from 'mongoose'

import { IGlobalBetaModel, IGlobalBetaSchema } from 'src/types/global_beta'

export const GLOBAL_BETA_SCHEMA_ID = 'globalBeta'

const GlobalBetaSchema = new Schema<IGlobalBetaSchema, IGlobalBetaModel>(
  {
    name: {
      type: Schema.Types.String,
      required: true,
    },
    enabled: {
      type: Schema.Types.Boolean,
      required: true,
    },
  },
  { collection: GLOBAL_BETA_SCHEMA_ID },
)

// Statics
/**
 * Find beta flag document given beta flag name
 */
GlobalBetaSchema.statics.findFlag = async function (flag: string) {
  return await this.findOne({ name: flag }).exec()
}

const compileGlobalBetaModel = (db: Mongoose): IGlobalBetaModel => {
  const GlobalBetaModel = db.model<IGlobalBetaSchema, IGlobalBetaModel>(
    GLOBAL_BETA_SCHEMA_ID,
    GlobalBetaSchema,
  )

  return GlobalBetaModel
}

const getGlobalBetaModel = (db: Mongoose): IGlobalBetaModel => {
  try {
    return db.model<IGlobalBetaSchema, IGlobalBetaModel>(GLOBAL_BETA_SCHEMA_ID)
  } catch {
    return compileGlobalBetaModel(db)
  }
}

export default getGlobalBetaModel
