import { Model, Mongoose, Schema } from 'mongoose'
import validator from 'validator'

import { bounceLifeSpan } from '../../config/config'
import { IBounceSchema } from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'

export const BOUNCE_SCHEMA_ID = 'Bounce'

export interface IBounceModel extends Model<IBounceSchema> {}

const BounceSchema = new Schema<IBounceSchema>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: FORM_SCHEMA_ID,
    required: 'Form ID is required',
  },
  hasAlarmed: {
    type: Boolean,
    default: false,
  },
  bounces: {
    type: [
      {
        email: {
          type: String,
          trim: true,
          required: true,
          validate: {
            validator: validator.isEmail,
            message: 'Bounced email must be a valid email address',
          },
        },
        hasBounced: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + bounceLifeSpan),
  },
})
BounceSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

const getBounceModel = (db: Mongoose) => {
  try {
    return db.model(BOUNCE_SCHEMA_ID) as IBounceModel
  } catch {
    return db.model<IBounceSchema>(BOUNCE_SCHEMA_ID, BounceSchema)
  }
}

export default getBounceModel
