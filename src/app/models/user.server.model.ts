import { Model, Mongoose, Schema } from 'mongoose'
import validator from 'validator'

import { IUserSchema } from '../../types'

import getAgencyModel, { AGENCY_SCHEMA_ID } from './agency.server.model'

export const USER_SCHEMA_ID = 'User'

export interface IUserModel extends Model<IUserSchema> {}

const compileUserModel = (db: Mongoose) => {
  const Agency = getAgencyModel(db)

  const UserSchema = new Schema<IUserSchema>({
    email: {
      type: String,
      trim: true,
      unique: 'Account already exists with this email',
      required: 'Please enter your email',
      validate: {
        // Check if email entered exists in the Agency collection
        validator: async (value: string) => {
          return new Promise<boolean>((resolve, reject) => {
            if (!validator.isEmail(value)) {
              return resolve(false)
            }
            const emailDomain = value.split('@').pop()

            Agency.findOne({ emailDomain }, (err, agency) => {
              if (err || !agency) {
                return reject(err)
              } else {
                return resolve(true)
              }
            })
          })
        },
        message: 'This email is not a valid agency email',
      },
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: AGENCY_SCHEMA_ID,
      required: 'Agency is required',
    },
    created: {
      type: Date,
      default: Date.now,
    },
    betaFlags: {},
  })

  return db.model<IUserSchema>(USER_SCHEMA_ID, UserSchema)
}

/**
 * Retrieves the User model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the User model from
 * @returns The User model
 */
const getUserModel = (db: Mongoose) => {
  try {
    return db.model(USER_SCHEMA_ID) as IUserModel
  } catch {
    return compileUserModel(db)
  }
}

export default getUserModel
