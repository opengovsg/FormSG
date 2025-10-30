import { EmailNotifications } from './email-notifications'
import { General } from './general'
import { MultiLanguage } from './multi-language'
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
  multiLanguage: MultiLanguage
}
