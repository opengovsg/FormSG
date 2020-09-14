import { Document } from 'mongoose'

import { IFormSchema } from './form'
import { IEmailNotification } from './sns'

export interface ISingleBounce {
  email: string
  hasBounced: boolean
}

export interface IBounce {
  formId: IFormSchema['_id']
  bounces: ISingleBounce[]
  hasEmailed: boolean
  expireAt: Date
  _id: Document['_id']
}

export interface IBounceSchema extends IBounce, Document {
  merge: (latestBounces: IBounceSchema, snsInfo: IEmailNotification) => void
  isCriticalBounce: () => boolean
}
