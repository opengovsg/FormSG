import crypto from 'crypto'
import { Mongoose, Schema } from 'mongoose'

import { sessionSecret } from '../../../config/config'
import { IHashes, IMyInfoHashModel, IMyInfoHashSchema } from '../../../types'
import { FORM_SCHEMA_ID } from '../../models/form.server.model'

export const MYINFO_HASH_SCHEMA_ID = 'MyInfoHash'

const MyInfoHashSchema = new Schema<IMyInfoHashSchema, IMyInfoHashModel>(
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

MyInfoHashSchema.statics.updateHashes = async function (
  this: IMyInfoHashModel,
  uinFin: string,
  formId: string,
  readOnlyHashes: IHashes,
  spCookieMaxAge: number,
): Promise<IMyInfoHashSchema | null> {
  const hashedUinFin = crypto
    .createHmac('sha256', sessionSecret)
    .update(uinFin)
    .digest('hex')
  return this.findOneAndUpdate(
    {
      uinFin: hashedUinFin,
      form: formId,
    },
    {
      $set: {
        fields: readOnlyHashes,
        expireAt: new Date(Date.now() + spCookieMaxAge),
      },
    },
    { upsert: true, new: true },
  )
}

MyInfoHashSchema.statics.findHashes = async function (
  this: IMyInfoHashModel,
  uinFin: string,
  formId: string,
): Promise<IHashes | null> {
  const hashedUinFin = crypto
    .createHmac('sha256', sessionSecret)
    .update(uinFin)
    .digest('hex')
  const hashInfo = await this.findOne({
    uinFin: hashedUinFin,
    form: formId,
  })
  return hashInfo ? hashInfo.fields : null
}

const compileMyInfoHashModel = (db: Mongoose) =>
  db.model<IMyInfoHashSchema, IMyInfoHashModel>(
    MYINFO_HASH_SCHEMA_ID,
    MyInfoHashSchema,
  )

/**
 * Retrieves the MyInfoHash model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the MyInfoHash model from
 * @returns The MyInfoHash model
 */
const getMyInfoHashModel = (db: Mongoose): IMyInfoHashModel => {
  try {
    return db.model(MYINFO_HASH_SCHEMA_ID) as IMyInfoHashModel
  } catch {
    return compileMyInfoHashModel(db)
  }
}

export default getMyInfoHashModel
