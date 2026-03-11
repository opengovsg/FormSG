import { EmailNotifications } from './email-notifications'
import { General } from './general'
import { Payments } from './payments'
import { Webhooks } from './webhooks'

export * from './en-sg'

export type HasTitle = {
  title: string
}

export interface Settings {
  general: General
  singpass: HasTitle
  emailNotifications: EmailNotifications
  webhooks: Webhooks
  payments: Payments
}
