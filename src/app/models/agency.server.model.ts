import { pick } from 'lodash'
import { Mongoose, Schema } from 'mongoose'

import { PublicAgencyDto } from '../../../shared/types'
import { AgencyInstanceMethods, IAgencyModel, IAgencySchema } from '../../types'

export const AGENCY_SCHEMA_ID = 'Agency'

// Exported for testing.
export const AGENCY_PUBLIC_FIELDS = [
  'shortName',
  'fullName',
  'emailDomain',
  'logo',
]

const AgencySchema = new Schema<
  IAgencySchema,
  IAgencyModel,
  undefined,
  AgencyInstanceMethods
>(
  {
    shortName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    emailDomain: {
      type: [
        {
          type: String,
          trim: true,
          match: [/.+\..+/, 'Please fill a valid email domain.'],
        },
      ],
      required: true, // must have at least one element
    },
    logo: {
      type: String,
      required: true,
      trim: true,
    },
    business: {
      type: {
        address: { type: String, required: true, trim: true },
        gstRegNo: { type: String, required: true, trim: true },
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'lastModified',
    },
  },
)

// Methods
AgencySchema.methods.getPublicView = function (): PublicAgencyDto {
  return pick(this, Object.keys(PublicAgencyDto.shape)) as PublicAgencyDto
}

const compileAgencyModel = (db: Mongoose): IAgencyModel => {
  return db.model<IAgencySchema, IAgencyModel>(AGENCY_SCHEMA_ID, AgencySchema)
}

/**
 * Retrieves the Agency model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the Agency model from
 * @returns The agency model
 */
const getAgencyModel = (db: Mongoose): IAgencyModel => {
  try {
    return db.model<IAgencySchema, IAgencyModel>(AGENCY_SCHEMA_ID)
  } catch {
    return compileAgencyModel(db)
  }
}

export default getAgencyModel
