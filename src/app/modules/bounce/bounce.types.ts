import { UserWithContactNumber } from '../user/user.types'

export interface AdminNotificationRecipients {
  emailRecipients: string[]
  smsRecipients: UserWithContactNumber[]
}
