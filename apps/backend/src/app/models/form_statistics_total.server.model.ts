import { Mongoose, Schema } from 'mongoose'
import { ExtractTypeFromArray } from 'shared/types'

import {
  AggregateFormCountResult,
  IFormStatisticsTotalModel,
  IFormStatisticsTotalSchema,
} from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'

const FORM_STATS_TOTAL_SCHEMA_ID = 'FormStatisticsTotal'
const FORM_STATS_COLLECTION_NAME = 'formStatisticsTotal'

const compileFormStatisticsTotalModel = (db: Mongoose) => {
  const FormStatisticsTotalSchema = new Schema<
    IFormStatisticsTotalSchema,
    IFormStatisticsTotalModel
  >(
    {
      formId: {
        type: Schema.Types.ObjectId,
        ref: FORM_SCHEMA_ID,
        required: true,
      },
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
    function (next) {
      next(new Error('FormStatisticsTotal schema is read only'))
    },
  )

  // Static functions
  FormStatisticsTotalSchema.statics.aggregateFormCount = function (
    minSubCount: number,
  ): Promise<AggregateFormCountResult> {
    return this.aggregate<ExtractTypeFromArray<AggregateFormCountResult>>([
      {
        $match: {
          totalCount: {
            $gt: minSubCount,
          },
        },
      },
      {
        $count: 'numActiveForms',
      },
    ]).exec()
  }

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
const getFormStatisticsTotalModel = (
  db: Mongoose,
): IFormStatisticsTotalModel => {
  try {
    return db.model(FORM_STATS_TOTAL_SCHEMA_ID) as IFormStatisticsTotalModel
  } catch {
    return compileFormStatisticsTotalModel(db)
  }
}

export default getFormStatisticsTotalModel
