import { ResultsEventType } from 'formsg-shared/types'
import { Mongoose, Schema } from 'mongoose'

import { IResultsEventModel, IResultsEventSchema } from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'
import { USER_SCHEMA_ID } from './user.server.model'

export const RESULTS_EVENT_COLLECTION_NAME = 'resultsEvents'

const DASHBOARD_VERSIONS = ['v1', 'v2']

const ResultsEventSchema = new Schema<IResultsEventSchema, IResultsEventModel>(
  {
    type: {
      type: String,
      enum: Object.values(ResultsEventType),
      required: true,
    },
    form: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: USER_SCHEMA_ID,
      required: true,
    },
    dashboardVersion: { type: String, enum: DASHBOARD_VERSIONS },
    formats: {
      type: [{ type: String, enum: ['csv', 'attachments', 'pdf'] }],
      default: undefined,
    },
    scope: { type: String, enum: ['bulk', 'single'] },
    savedViewId: { type: Schema.Types.ObjectId },
    isSavedViewModified: { type: Boolean },
    savedViewAgeMs: { type: Number, min: 0 },
    responsesCount: { type: Number, min: 0 },
    from: { type: String, enum: DASHBOARD_VERSIONS },
    to: { type: String, enum: DASHBOARD_VERSIONS },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: false,
    },
  },
)

ResultsEventSchema.index({ type: 1, created: -1 })
ResultsEventSchema.index({ form: 1, created: -1 })

const getResultsEventModel = (db: Mongoose): IResultsEventModel => {
  try {
    return db.model<IResultsEventSchema, IResultsEventModel>(
      RESULTS_EVENT_COLLECTION_NAME,
    )
  } catch {
    return db.model<IResultsEventSchema, IResultsEventModel>(
      RESULTS_EVENT_COLLECTION_NAME,
      ResultsEventSchema,
      RESULTS_EVENT_COLLECTION_NAME,
    )
  }
}

export default getResultsEventModel
