import { Mongoose, Schema } from 'mongoose'

import {
  AuthType,
  ILoginModel,
  ILoginSchema,
  IPopulatedForm,
  LoginStatistic,
} from '../../types'

import { AGENCY_SCHEMA_ID } from './agency.server.model'
import { FORM_SCHEMA_ID } from './form.server.model'
import { USER_SCHEMA_ID } from './user.server.model'

export const LOGIN_SCHEMA_ID = 'Login'

const LoginSchema = new Schema<ILoginSchema, ILoginModel>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: USER_SCHEMA_ID,
      required: true,
    },
    form: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: AGENCY_SCHEMA_ID,
      required: true,
    },
    authType: {
      type: String,
      enum: Object.values(AuthType),
      required: true,
    },
    esrvcId: {
      type: String,
      required: true,
      validate: [
        /^([a-zA-Z0-9-]){1,25}$/i,
        'e-service ID must be alphanumeric, dashes are allowed',
      ],
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: false,
    },
  },
)

LoginSchema.statics.addLoginFromForm = function (
  form: IPopulatedForm,
): Promise<ILoginSchema> {
  if (!form.authType || !form.esrvcId) {
    return Promise.reject(
      new Error('Form does not contain authType or e-service ID'),
    )
  }
  return this.create({
    form: form._id,
    admin: form.admin._id,
    agency: form.admin.agency._id,
    authType: form.authType,
    esrvcId: form.esrvcId,
  })
}

LoginSchema.statics.aggregateLoginStats = function (
  esrvcId: string,
  gte: Date,
  lte: Date,
): Promise<LoginStatistic[]> {
  return this.aggregate<LoginStatistic>([
    {
      $match: {
        esrvcId,
        created: {
          $gte: gte,
          $lte: lte,
        },
      },
    },
    {
      $group: {
        _id: {
          form: '$form',
          admin: '$admin',
          authType: '$authType',
        },
        total: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.admin',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $unwind: '$userInfo',
    },
    {
      $lookup: {
        from: 'forms',
        localField: '_id.form',
        foreignField: '_id',
        as: 'formInfo',
      },
    },
    {
      $unwind: '$formInfo',
    },
    {
      $project: {
        _id: 0,
        adminEmail: '$userInfo.email',
        formName: '$formInfo.title',
        total: '$total',
        formId: '$_id.form',
        authType: '$_id.authType',
      },
    },
  ]).exec()
}

const compileLoginModel = (db: Mongoose) =>
  db.model<ILoginSchema, ILoginModel>(LOGIN_SCHEMA_ID, LoginSchema)

/**
 * Retrieves the Login model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the Login model from
 * @returns The login model
 */
const getLoginModel = (db: Mongoose): ILoginModel => {
  try {
    return db.model<ILoginSchema, ILoginModel>(LOGIN_SCHEMA_ID)
  } catch {
    return compileLoginModel(db)
  }
}

export default getLoginModel
