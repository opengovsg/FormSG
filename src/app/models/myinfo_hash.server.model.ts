import { Model, Mongoose, Schema } from 'mongoose'

import { IMyInfoHashSchema } from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'

export const MYINFO_HASH_SCHEMA_ID = 'MyInfoHash'

const MyInfoHashSchema = new Schema<IMyInfoHashSchema>(
  {
    // We stored a hashed uinFin using a salt stored as a env var
    // Note: key name not updated to reflect this for backward compatibility purposes
    uinFin: {
      type: String,
      required: true,
      trim: true,
    },
    form: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    fields: {
      type: Object,
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: false,
    },
  },
)

MyInfoHashSchema.index({
  form: 1,
  uinFin: 1,
})
MyInfoHashSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

const compileMyInfoHashModel = (db: Mongoose) =>
  db.model<IMyInfoHashSchema>(MYINFO_HASH_SCHEMA_ID, MyInfoHashSchema)

/**
 * Retrieves the MyInfoHash model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the MyInfoHash model from
 * @returns The MyInfoHash model
 */
const getMyInfoHashModel = (db: Mongoose) => {
  try {
    return db.model(MYINFO_HASH_SCHEMA_ID) as Model<IMyInfoHashSchema>
  } catch {
    return compileMyInfoHashModel(db)
  }
}

export default getMyInfoHashModel
