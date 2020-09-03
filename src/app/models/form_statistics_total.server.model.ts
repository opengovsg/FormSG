import { Model, Mongoose, Schema } from 'mongoose'

import { IFormStatisticsTotalSchema } from '../../types'

const FORM_STATS_TOTAL_SCHEMA_ID = 'FormStatisticsTotal'
const FORM_STATS_COLLECTION_NAME = 'formStatisticsTotal'

type IFormStatisticsTotalModel = Model<IFormStatisticsTotalSchema>

const compileFormStatisticsTotalModel = (db: Mongoose) => {
  const FormStatisticsTotalSchema = new Schema<IFormStatisticsTotalSchema>(
    {
      totalCount: {
        type: Number,
        required: true,
        min: 1,
      },
      lastSubmission: {
        type: Date,
        required: true,
      },
    },
    {
      read: 'secondary',
    },
  )

  // Indices
  FormStatisticsTotalSchema.index({ totalCount: 1 })
  FormStatisticsTotalSchema.index({ formId: 1 })

  // Hooks
  FormStatisticsTotalSchema.pre<IFormStatisticsTotalSchema>(
    'save',
    function () {
      throw new Error('FormStatisticsTotal schema is read only')
    },
  )

  const FormStatisticsTotalModel = db.model<
    IFormStatisticsTotalSchema,
    IFormStatisticsTotalModel
  >(
    FORM_STATS_TOTAL_SCHEMA_ID,
    FormStatisticsTotalSchema,
    FORM_STATS_COLLECTION_NAME,
  )

  return FormStatisticsTotalModel
}

/**
 * Retrieves the FormStatisticsTotal model on the given Mongoose instance. If
 * the model is not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the FormStatisticsTotal model from
 * @returns The FormStatisticsTotal model
 */
const getFormStatisticsTotalModel = (db: Mongoose) => {
  try {
    return db.model(FORM_STATS_TOTAL_SCHEMA_ID) as IFormStatisticsTotalModel
  } catch {
    return compileFormStatisticsTotalModel(db)
  }
}

export default getFormStatisticsTotalModel
