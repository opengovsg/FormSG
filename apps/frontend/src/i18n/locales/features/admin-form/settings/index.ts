import { EmailNotifications } from './email-notifications'
import { General } from './general'
import { Payments } from './payments'
import { Webhooks } from './webhooks'

export * from './en-sg'

export type HasTitle = {
  title: string
}

export interface SettingsTabsStrings {
  newBadge: string
  multiLanguage: string
}

export interface SecretKeyModalStrings {
  fieldLabel: string
  uploadFromFileAriaLabel: string
  validation: {
    required: string
    invalidSecretKey: string
  }
  placeholder: {
    dragging: string
    default: string
  }
  ackLabel: string
  activation: {
    modalTitle: string
    submitButton: string
  }
  whitelistCsv: {
    modalTitle: string
    submitButton: string
  }
}

export interface Settings {
  general: General
  singpass: HasTitle
  tabs: SettingsTabsStrings
  secretKeyModal: SecretKeyModalStrings
  emailNotifications: EmailNotifications
  webhooks: Webhooks
  payments: Payments
}
