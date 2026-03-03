import { Model } from 'mongoose'

import { IFormSchema } from './form'

export interface IFormWhitelistedSubmitterIdsSchema {
  formId: IFormSchema['_id']
  myPublicKey: string
  myPrivateKey: string
  nonce: string
  cipherTexts: string[]
}

export interface IFormWhitelistedSubmitterIdsModel
  extends Model<IFormWhitelistedSubmitterIdsSchema> {
  findEncryptionPropertiesById(
    whitelistId: string,
  ): Promise<
    Pick<
      IFormWhitelistedSubmitterIdsSchema,
      'myPublicKey' | 'myPrivateKey' | 'nonce'
    >
  >

  checkIfSubmitterIdIsWhitelisted(
    whitelistId: string,
    submitterId: string,
  ): Promise<boolean>
}
