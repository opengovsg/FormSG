import { SetRequired } from 'type-fest'

import { UserContactView } from '../../../types'

export type UserWithContactNumber = SetRequired<UserContactView, 'contact'>

export interface AdminNotificationResult {
  emailRecipients: string[]
  smsRecipients: UserWithContactNumber[]
}
