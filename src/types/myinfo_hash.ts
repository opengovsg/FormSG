import { Document } from 'mongoose'

import { MyInfoAttribute } from './field'
import { IFormSchema } from './form'

type IHashes = {
  [key in MyInfoAttribute]: string
}

interface IMyInfoHash {
  uinFin: string
  form: IFormSchema['_id']
  fields: IHashes
  expireAt: Date
  created: Date
}

export interface IMyInfoHashSchema extends IMyInfoHash, Document {}
