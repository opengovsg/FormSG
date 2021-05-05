import { Document } from 'mongoose'

import { IFormSchema } from './form'
import { BounceType, IEmailNotification } from './sns'
import { UserContactView } from './user'

// Enforce that bounceType is present if hasBounced is true
export type ISingleBounce =
  | {
      email: string
      hasBounced: true
      bounceType: BounceType
    }
  | {
      email: string
      hasBounced: false
    }

export interface IBounce {
  formId: IFormSchema['_id']
  bounces: ISingleBounce[]
  hasAutoEmailed: boolean
  hasAutoSmsed: boolean
  expireAt: Date
}

export interface IBounceSchema extends IBounce, Document {
  updateBounceInfo: (snsInfo: IEmailNotification) => IBounceSchema
  isCriticalBounce: () => boolean
  areAllPermanentBounces: () => boolean
  getEmails: () => string[]
  setNotificationState: (
    emailRecipients: string[],
    smsRecipients: UserContactView[],
  ) => void
  hasNotified: () => boolean
}
