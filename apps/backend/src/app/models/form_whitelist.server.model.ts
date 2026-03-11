import { Mongoose, Schema } from 'mongoose'

import {
  IFormWhitelistedSubmitterIdsModel,
  IFormWhitelistedSubmitterIdsSchema,
} from 'src/types'

import { FORM_SCHEMA_ID } from './form.server.model'

export const FORM_WHITELISTED_SUBMITTER_IDS_ID = 'FormWhitelistedSubmitterIds'

const formWhitelistedSubmitterIdsSchema = new Schema<
  IFormWhitelistedSubmitterIdsSchema,
  IFormWhitelistedSubmitterIdsModel
>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: () => FORM_SCHEMA_ID,
    required: true,
  },
  myPublicKey: {
    type: String,
    required: true,
  },
  myPrivateKey: {
    type: String,
    required: true,
    select: false,
  },
  nonce: {
    type: String,
    required: true,
  },
  cipherTexts: {
    type: [{ type: String, required: true }],
    required: true,
    validate: [
      (v: string[]) => {
        return Array.isArray(v) && v.length > 0
      },
      'cipherTexts must be non-empty array',
    ],
  },
})

formWhitelistedSubmitterIdsSchema.statics.checkIfSubmitterIdIsWhitelisted =
  async function (whitelistId: string, submitterId: string) {
    return this.exists({
      _id: whitelistId,
      cipherTexts: submitterId,
    }).exec()
  }

formWhitelistedSubmitterIdsSchema.statics.findEncryptionPropertiesById =
  async function (whitelistId: string) {
    const encryptionProperties = 'myPublicKey myPrivateKey nonce'
    return await this.findById(whitelistId)
      .select(encryptionProperties)
      .lean()
      .exec()
  }

const compileFormWhitelistedSubmitterIdsModel = (
  db: Mongoose,
): IFormWhitelistedSubmitterIdsModel => {
  const FormWhitelistedSubmitterIdsModel = db.model<
    IFormWhitelistedSubmitterIdsSchema,
    IFormWhitelistedSubmitterIdsModel
  >(FORM_WHITELISTED_SUBMITTER_IDS_ID, formWhitelistedSubmitterIdsSchema)

  return FormWhitelistedSubmitterIdsModel
}

const getFormWhitelistSubmitterIdsModel = (
  db: Mongoose,
): IFormWhitelistedSubmitterIdsModel => {
  try {
    return db.model<
      IFormWhitelistedSubmitterIdsSchema,
      IFormWhitelistedSubmitterIdsModel
    >(FORM_WHITELISTED_SUBMITTER_IDS_ID)
  } catch {
    return compileFormWhitelistedSubmitterIdsModel(db)
  }
}

export default getFormWhitelistSubmitterIdsModel
