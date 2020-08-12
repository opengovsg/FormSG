import { Document } from 'mongoose'

import { IFormSchema } from './form'

interface ISingleBounce {
  email: string
  hasBounced: boolean
}

export interface IBounce {
  formId: IFormSchema['_id']
  bounces: ISingleBounce[]
  hasAlarmed: boolean
  _id: Document['_id']
}

export interface IBounceSchema extends IBounce, Document {}
