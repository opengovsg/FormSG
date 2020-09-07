import { Model, Mongoose, Schema } from 'mongoose'

import { IAgencySchema } from '../../types'

export const AGENCY_SCHEMA_ID = 'Agency'

const AgencySchema = new Schema<IAgencySchema>(
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
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'lastModified',
    },
  },
)

const compileAgencyModel = (db: Mongoose): Model<IAgencySchema> =>
  db.model<IAgencySchema>(AGENCY_SCHEMA_ID, AgencySchema)

/**
 * Retrieves the Agency model on the given Mongoose instance. If the model is
 * not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the Agency model from
 * @returns The agency model
 */
const getAgencyModel = (db: Mongoose): Model<IAgencySchema> => {
  try {
    return db.model(AGENCY_SCHEMA_ID) as Model<IAgencySchema>
  } catch {
    return compileAgencyModel(db)
  }
}

export default getAgencyModel
