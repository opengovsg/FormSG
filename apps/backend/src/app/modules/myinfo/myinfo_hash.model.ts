import crypto from 'crypto'
import { Mongoose, Schema } from 'mongoose'

import {
  IHashes,
  IMyInfoHashModel,
  IMyInfoHashSchema,
  MyInfoHashScope,
} from '../../../types'
import { sessionSecret } from '../../config/config'
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
    // Set only for a later MRF step's login; Step 1 hashes have neither.
    authSessionId: {
      type: String,
    },
    workflowStep: {
      type: Number,
      min: 0,
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

// Scoped hashes belong to one later-step login; Step 1 (and storage mode)
// hashes have no scope, so neither can read or overwrite the other.
const scopeFilter = (scope?: MyInfoHashScope) =>
  scope
    ? { authSessionId: scope.authSessionId, workflowStep: scope.workflowStep }
    : { authSessionId: { $exists: false } }

const hashUinFin = (uinFin: string): string =>
  crypto.createHmac('sha256', sessionSecret).update(uinFin).digest('hex')

MyInfoHashSchema.statics.updateHashes = async function (
  uinFin: string,
  formId: string,
  readOnlyHashes: IHashes,
  spCookieMaxAge: number,
  scope?: MyInfoHashScope,
): Promise<IMyInfoHashSchema | null> {
  return this.findOneAndUpdate(
    {
      uinFin: hashUinFin(uinFin),
      form: formId,
      ...scopeFilter(scope),
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
  uinFin: string,
  formId: string,
  scope?: MyInfoHashScope,
): Promise<IHashes | null> {
  const hashInfo = await this.findOne({
    uinFin: hashUinFin(uinFin),
    form: formId,
    ...scopeFilter(scope),
    // TTL deletion lags, so a later-step login also checks expiry itself.
    ...(scope ? { expireAt: { $gt: new Date() } } : {}),
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
