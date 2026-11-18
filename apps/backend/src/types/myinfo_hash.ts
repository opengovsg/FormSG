import { MyInfoAttribute } from 'formsg-shared/types'
import { Document, Model } from 'mongoose'

import { MyInfoChildKey } from '../app/modules/myinfo/myinfo.types'

import { IFormSchema } from './form'

export type IHashes = Partial<{
  [key in MyInfoAttribute | MyInfoChildKey]: string
}>

/**
 * A later MRF step's MyInfo login session. Absent for Step 1 and other forms,
 * whose hashes are keyed by form and NRIC alone.
 */
export type MyInfoHashScope = {
  authSessionId: string
  workflowStep: number
}

interface IMyInfoHash extends Partial<MyInfoHashScope> {
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
    scope?: MyInfoHashScope,
  ) => Promise<IMyInfoHashSchema | null>
  findHashes: (
    uinFin: string,
    formId: string,
    scope?: MyInfoHashScope,
  ) => Promise<IHashes | null>
}
