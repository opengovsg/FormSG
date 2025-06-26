import { Mongoose, Schema } from 'mongoose'

import { FORM_SCHEMA_ID } from '../../models/form.server.model'
import { USER_SCHEMA_ID } from '../../models/user.server.model'

import {
  IAdminContactSmsCountSchema,
  ISmsCount,
  ISmsCountModel,
  ISmsCountSchema,
  IVerificationSmsCountSchema,
  LogSmsParams,
  LogType,
  SmsType,
} from './sms.types'

const SMS_COUNT_SCHEMA_NAME = 'smsVerification'

const v3StartDate = new Date('2025-06-30T16:00:00.000+00:00') // UTC time

const VerificationSmsCountSchema = new Schema<IVerificationSmsCountSchema>({
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
})

const AdminContactSmsCountSchema = new Schema<IAdminContactSmsCountSchema>({
  admin: {
    type: Schema.Types.ObjectId,
    ref: USER_SCHEMA_ID,
    required: true,
  },
})

const compileSmsCountModel = (db: Mongoose) => {
  const SmsCountSchema = new Schema<ISmsCountSchema, ISmsCountModel>(
    {
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
      discriminatorKey: 'smsType',
      collection: 'sms',
    },
  )

  SmsCountSchema.statics.logSms = async function ({
    smsData,
    smsType,
    logType,
  }: LogSmsParams) {
    const schemaData: Omit<ISmsCount, '_id'> = {
      ...smsData,
      smsType,
      logType,
    }

    const smsCount: ISmsCountSchema = new this(schemaData)

    return smsCount.save()
  }

  SmsCountSchema.statics.retrieveSmsCounts = async function (formId: string) {
    return this.countDocuments({
      form: formId,
      smsType: SmsType.Verification,
      createdAt: { $gte: v3StartDate },
    })
      .read('secondary')
      .exec()
  }

  const SmsCountModel = db.model<ISmsCountSchema, ISmsCountModel>(
    SMS_COUNT_SCHEMA_NAME,
    SmsCountSchema,
  )

  // Adding Discriminators
  SmsCountModel.discriminator(SmsType.Verification, VerificationSmsCountSchema)
  SmsCountModel.discriminator(SmsType.AdminContact, AdminContactSmsCountSchema)

  return SmsCountModel
}

/**
 * Retrieves the SmsCount model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the SmsCount model from
 * @returns The SmsCount model
 */
const getSmsCountModel = (db: Mongoose): ISmsCountModel => {
  try {
    return db.model(SMS_COUNT_SCHEMA_NAME) as ISmsCountModel
  } catch {
    return compileSmsCountModel(db)
  }
}
export default getSmsCountModel
