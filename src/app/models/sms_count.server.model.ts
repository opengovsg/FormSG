import { Model, Mongoose, Schema } from 'mongoose'

import {
  ISmsCount,
  ISmsCountSchema,
  LogSmsParams,
  LogType,
  SmsType,
} from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'
import { USER_SCHEMA_ID } from './user.server.model'

const SMS_COUNT_SCHEMA_NAME = 'SmsCount'

interface ISmsCountModel extends Model<ISmsCountSchema> {
  logSms: (logParams: LogSmsParams) => Promise<ISmsCountSchema>
}

const SmsCountSchema = new Schema<ISmsCountSchema>(
  {
    form: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    formAdmin: {
      email: { type: String, required: true },
      userId: {
        type: Schema.Types.ObjectId,
        ref: USER_SCHEMA_ID,
        required: true,
      },
    },
    msgSrvcSid: {
      type: String,
      required: true,
    },
    logType: {
      type: String,
      enum: Object.values(LogType),
      required: true,
    },
    smsType: {
      type: String,
      enum: Object.values(SmsType),
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
)

SmsCountSchema.statics.logSms = async function (
  this: ISmsCountModel,
  { otpData, msgSrvcSid, smsType, logType }: LogSmsParams,
) {
  const schemaData: Omit<ISmsCount, '_id'> = {
    ...otpData,
    msgSrvcSid,
    smsType,
    logType,
  }

  const smsCount: ISmsCountSchema = new this(schemaData)

  return smsCount.save()
}

const compileSmsCountModel = (db: Mongoose) => {
  return db.model<ISmsCountSchema, ISmsCountModel>(
    SMS_COUNT_SCHEMA_NAME,
    SmsCountSchema,
  )
}

/**
 * Retrieves the SmsCount model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the SmsCount model from
 * @returns The SmsCount model
 */
const getSmsCountModel = (db: Mongoose) => {
  try {
    return db.model(SMS_COUNT_SCHEMA_NAME) as ISmsCountModel
  } catch {
    return compileSmsCountModel(db)
  }
}
export default getSmsCountModel
