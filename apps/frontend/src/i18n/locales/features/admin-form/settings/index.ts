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

export interface SecretKeyVerificationStrings {
  errors: {
    invalidFile: string
    invalidKey: string
  }
}

export interface SettingsMutationsStrings {
  missingFormId: string
  formStatus: {
    openStorageMode: string
    open: string
    closed: string
  }
  multiLang: {
    enabled: string
    disabled: string
  }
  supportedLanguages: {
    selectable: string
    hidden: string
  }
  saveDraft: {
    enabled: string
    disabled: string
  }
  captcha: {
    enabled: string
    disabled: string
  }
  issueNotification: {
    enabled: string
    disabled: string
  }
  formTitleUpdated: string
  inactiveMessageUpdated: string
  emailsUpdated: string
  esrvcIdUpdated: string
  authType: {
    enabled: string
    disabled: string
    updated: string
  }
  submitterId: {
    enabled: string
    disabled: string
  }
  singleSubmission: {
    enabled: string
    disabled: string
  }
  whitelist: {
    uploaded: string
    removed: string
  }
  webhookUrl: {
    updated: string
    removed: string
  }
  webhookRetries: {
    enabled: string
    disabled: string
  }
  webhookFormat: {
    v1: string
    v4: string
  }
  businessInfoUpdated: string
  gstUpdated: string
}

export interface Settings {
  general: General
  singpass: HasTitle
  tabs: SettingsTabsStrings
  secretKeyModal: SecretKeyModalStrings
  secretKeyVerification: SecretKeyVerificationStrings
  mutations: SettingsMutationsStrings
  emailNotifications: EmailNotifications
  webhooks: Webhooks
  payments: Payments
}
