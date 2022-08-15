import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile'
import { MongoError } from 'mongodb'
import { CallbackError, Mongoose, Schema } from 'mongoose'
import validator from 'validator'

import {
  AgencyDocument,
  IUser,
  IUserModel,
  IUserSchema,
  PublicUser,
} from '../../types'

import getAgencyModel, { AGENCY_SCHEMA_ID } from './agency.server.model'

export const USER_SCHEMA_ID = 'User'

const compileUserModel = (db: Mongoose) => {
  const Agency = getAgencyModel(db)

  const UserSchema: Schema<IUserSchema, IUserModel> = new Schema(
    {
      email: {
        type: String,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        trim: true,
        unique: true,
        required: 'Please enter your email',
        validate: {
          // Check if email entered exists in the Agency collection
          validator: async (value: string) => {
            if (!validator.isEmail(value)) {
              return false
            }

            const emailDomain = value.split('@').pop()
            try {
              const agency = await Agency.findOne({ emailDomain })
              return !!agency
            } catch {
              return false
            }
          },
          message: 'This email is not a valid agency email',
        },
      },
      agency: {
        type: Schema.Types.ObjectId,
        ref: AGENCY_SCHEMA_ID,
        required: 'Agency is required',
      },
      contact: {
        type: String,
        validate: {
          // Check if phone number is valid.
          validator: function (value: string) {
            const phoneNumber = parsePhoneNumberFromString(value)
            if (!phoneNumber) return false
            return phoneNumber.isValid()
          },
          message: (props: { value: string }) =>
            `${props.value} is not a valid mobile number`,
        },
      },
      lastAccessed: Date,
      updatedAt: {
        type: Date,
        default: () => Date.now(),
      },
      betaFlags: {
        sgid: Boolean,
      },
      flags: {
        lastSeenFeatureUpdateVersion: Number,
      },
    },
    {
      timestamps: {
        createdAt: 'created',
        updatedAt: false,
      },
    },
  )

  // Hooks
  /**
   * Unique key violation custom error middleware.
   *
   * Used because the `unique` schema option is not a validator, and will not
   * throw a ValidationError. Instead, another error will be thrown, which will
   * have to be caught here to output the expected error message.
   *
   * See: https://masteringjs.io/tutorials/mongoose/e11000-duplicate-key.
   */
  UserSchema.post<IUserSchema>(
    'save',
    function (err: Error, _doc: unknown, next: (err?: CallbackError) => void) {
      if (err) {
        if (err.name === 'MongoError' && (err as MongoError)?.code === 11000) {
          next(new Error('Account already exists with this email'))
        } else {
          next(err)
        }
      } else {
        next()
      }
    },
  )

  // Methods
  UserSchema.methods.getPublicView = function (): PublicUser {
    // Return public view of nested agency document if populated.
    return {
      agency: this.populated('agency')
        ? (this.agency as AgencyDocument).getPublicView()
        : this.agency,
    }
  }

  // Statics
  /**
   * Upserts given user details into User collection.
   */
  UserSchema.statics.upsertUser = async function (
    upsertParams: Pick<IUser, 'email' | 'agency' | 'lastAccessed'>,
  ) {
    return this.findOneAndUpdate(
      { email: upsertParams.email },
      { $set: upsertParams },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate({
      path: 'agency',
      model: AGENCY_SCHEMA_ID,
    })
  }

  /**
   * Finds the contact numbers for all given email addresses which exist in the
   * User collection.
   */
  UserSchema.statics.findContactNumbersByEmails = async function (
    emails: string[],
  ) {
    return this.find()
      .where('email')
      .in(emails)
      .select('email contact -_id')
      .lean()
      .exec()
  }

  return db.model<IUserSchema, IUserModel>(USER_SCHEMA_ID, UserSchema)
}

/**
 * Retrieves the User model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the User model from
 * @returns The User model
 */
const getUserModel = (db: Mongoose): IUserModel => {
  try {
    return db.model(USER_SCHEMA_ID) as IUserModel
  } catch {
    return compileUserModel(db)
  }
}

export default getUserModel
