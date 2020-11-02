import { Document, Model } from 'mongoose'

import { MyInfoAttribute } from './field'
import { IFormSchema } from './form'

export type IHashes = {
  [key in MyInfoAttribute]: string
}

interface IMyInfoHash {
  uinFin: string
  form: IFormSchema['_id']
  fields: IHashes
  expireAt: Date
  created: Date
  _id: Document['_id']
}

export interface IMyInfoHashSchema extends IMyInfoHash, Document {}

export interface IMyInfoHashModel extends Model<IMyInfoHashSchema> {
  updateHashes: (
    hashedUinFin: string,
    formId: string,
    readOnlyHashes: IHashes,
    spCookieMaxAge: number,
  ) => Promise<IMyInfoHashSchema | null>
}
