import { AnalyticsEventType } from 'formsg-shared/types'
import { Mongoose, Schema } from 'mongoose'

import { IAnalyticsEventModel, IAnalyticsEventSchema } from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'
import { USER_SCHEMA_ID } from './user.server.model'

export const ANALYTICS_EVENT_COLLECTION_NAME = 'analyticsEvents'

const AnalyticsEventSchema = new Schema<
  IAnalyticsEventSchema,
  IAnalyticsEventModel
>(
  {
    type: {
      type: String,
      enum: Object.values(AnalyticsEventType),
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
    content: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    minimize: false,
    timestamps: {
      createdAt: 'created',
      updatedAt: false,
    },
  },
)

AnalyticsEventSchema.index({ type: 1, created: -1 })
AnalyticsEventSchema.index({ form: 1, created: -1 })

const getAnalyticsEventModel = (db: Mongoose): IAnalyticsEventModel => {
  try {
    return db.model<IAnalyticsEventSchema, IAnalyticsEventModel>(
      ANALYTICS_EVENT_COLLECTION_NAME,
    )
  } catch {
    return db.model<IAnalyticsEventSchema, IAnalyticsEventModel>(
      ANALYTICS_EVENT_COLLECTION_NAME,
      AnalyticsEventSchema,
      ANALYTICS_EVENT_COLLECTION_NAME,
    )
  }
}

export default getAnalyticsEventModel
