import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile'
import { Mongoose, Schema } from 'mongoose'
import validator from 'validator'

import { FORM_SCHEMA_ID } from '../../models/form.server.model'
import { USER_SCHEMA_ID } from '../../models/user.server.model'

import {
  IAdminContactSmsCountSchema,
  IBouncedSubmissionSmsCountSchema,
  IFormDeactivatedSmsCountSchema,
  ISmsCount,
  ISmsCountModel,
  ISmsCountSchema,
  IVerificationSmsCountSchema,
  LogSmsParams,
  LogType,
  SmsType,
} from './sms.types'

const SMS_COUNT_SCHEMA_NAME = 'SmsCount'

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

const bounceSmsCountSchema = {
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
  collaboratorEmail: {
    type: String,
    validate: validator.isEmail,
    required: true,
  },
  recipientNumber: {
    type: String,
    validate: (value: string) => {
      const phoneNumber = parsePhoneNumberFromString(value)
      if (!phoneNumber) return false
      return phoneNumber.isValid()
    },
    required: true,
  },
}

const FormDeactivatedSmsCountSchema =
  new Schema<IFormDeactivatedSmsCountSchema>(bounceSmsCountSchema)

const BouncedSubmissionSmsCountSchema =
  new Schema<IBouncedSubmissionSmsCountSchema>(bounceSmsCountSchema)

const compileSmsCountModel = (db: Mongoose) => {
  const SmsCountSchema = new Schema<ISmsCountSchema, ISmsCountModel>(
    {
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
      discriminatorKey: 'smsType',
    },
  )

  SmsCountSchema.statics.logSms = async function (
    this: ISmsCountModel,
    { smsData, msgSrvcSid, smsType, logType }: LogSmsParams,
  ) {
    const schemaData: Omit<ISmsCount, '_id'> = {
      ...smsData,
      msgSrvcSid,
      smsType,
      logType,
    }

    const smsCount: ISmsCountSchema = new this(schemaData)

    return smsCount.save()
  }

  const SmsCountModel = db.model<ISmsCountSchema, ISmsCountModel>(
    SMS_COUNT_SCHEMA_NAME,
    SmsCountSchema,
  )

  // Adding Discriminators
  SmsCountModel.discriminator(SmsType.Verification, VerificationSmsCountSchema)
  SmsCountModel.discriminator(SmsType.AdminContact, AdminContactSmsCountSchema)
  SmsCountModel.discriminator(
    SmsType.DeactivatedForm,
    FormDeactivatedSmsCountSchema,
  )
  SmsCountModel.discriminator(
    SmsType.BouncedSubmission,
    BouncedSubmissionSmsCountSchema,
  )

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
