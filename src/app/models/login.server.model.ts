import { Model, Mongoose, Schema } from 'mongoose'

import { AuthType, ILoginSchema } from '../../types'

import { AGENCY_SCHEMA_ID } from './agency.server.model'
import { FORM_SCHEMA_ID } from './form.server.model'
import { USER_SCHEMA_ID } from './user.server.model'

export const LOGIN_SCHEMA_ID = 'Login'

const LoginSchema = new Schema<ILoginSchema>(
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
      match: [
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

const compileLoginModel = (db: Mongoose) =>
  db.model<ILoginSchema>(LOGIN_SCHEMA_ID, LoginSchema)

/**
 * Retrieves the Login model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the Login model from
 * @returns The login model
 */
const getLoginModel = (db: Mongoose) => {
  try {
    return db.model(LOGIN_SCHEMA_ID) as Model<ILoginSchema>
  } catch {
    return compileLoginModel(db)
  }
}

export default getLoginModel
