import { Document } from 'mongoose'

import { IFormSchema } from './form'
import { BounceType, IEmailNotification } from './sns'

// Enforce that bounceType is present if hasBounced is true
export type ISingleBounce =
  | {
      email: string
      hasBounced: true
      // TODO (private #44): this key should be required,
      // but is currently optional for backwards compatibility reasons.
      bounceType?: BounceType
    }
  | {
      email: string
      hasBounced: false
    }

export interface IBounce {
  formId: IFormSchema['_id']
  bounces: ISingleBounce[]
  hasEmailed: boolean
  expireAt: Date
  _id: Document['_id']
}

export interface IBounceSchema extends IBounce, Document {
  updateBounceInfo: (snsInfo: IEmailNotification) => IBounceSchema
  isCriticalBounce: () => boolean
  areAllPermanentBounces: () => boolean
  getEmails: () => string[]
  setHasEmailed: (emailRecipients: string[]) => void
}
