import { Document, Model } from 'mongoose'

import { MyInfoAttribute } from '../../shared/types'
import { MyInfoChildKey } from '../app/modules/myinfo/myinfo.types'

import { IFormSchema } from './form'

export type IHashes = Partial<{
  [key in MyInfoAttribute | MyInfoChildKey]: string
}>

interface IMyInfoHash {
  uinFin: string
  form: IFormSchema['_id']
  fields: IHashes
  expireAt: Date
  created: Date
}

export interface IMyInfoHashSchema extends IMyInfoHash, Document {}

export interface IMyInfoHashModel extends Model<IMyInfoHashSchema> {
  updateHashes: (
    uinFin: string,
    formId: string,
    readOnlyHashes: IHashes,
    spCookieMaxAge: number,
  ) => Promise<IMyInfoHashSchema | null>
  findHashes: (uinFin: string, formId: string) => Promise<IHashes | null>
}
