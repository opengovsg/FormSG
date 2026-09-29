import { EmailNotifications } from './email-notifications'
import { General } from './general'
import { MultiLanguage } from './multi-language'
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
  businessInfoUpdated: string
  gstUpdated: string
}

export interface SettingsStepLoginStrings {
  title: string
  newSubmissionsOnly: string
  closeFormToEdit: string
  laterStepsReadOnly: string
  stepTitle: string
  namedStepTitle: string
  anyoneWithLink: string
  emailField: string
  dropdownOptions: string
  deletedField: string
  edit: string
  editAriaLabel: string
  types: {
    nil: string
    myInfo: string
    cp: string
    sp: string
    sgid: string
    sgidMyInfo: string
  }
  badges: {
    collectsNric: string
    collectsUen: string
    onlyListedNrics: string
    onlyListedUens: string
    oneResponseEach: string
  }
  editor: {
    loginLabel: string
    free: string
    legacyProvider: string
    collectNric: string
    collectUen: string
    singleSubmission: string
    singleSubmissionPayments: string
    esrvcIdLabel: string
    esrvcIdDescription: string
    esrvcIdPlaceholder: string
    esrvcIdRequired: string
    esrvcIdWhitespace: string
    myInfoRemoved: string
    undo: string
    noStepsMyInfo: string
    lastSingpassStep: string
    save: string
    cancel: string
    saved: string
  }
  whitelist: {
    nricTitle: string
    uenTitle: string
    nricDescription: string
    uenDescription: string
    replacesOnSave: string
    removesOnSave: string
    droppedWithProvider: string
  }
  esrvcId: {
    title: string
    notSet: string
    usedBy: string
    unused: string
    change: string
    set: string
    modal: {
      title: string
      description: string
      descriptionShared: string
      cancel: string
      confirm: string
    }
  }
}

export interface Settings {
  general: General
  singpass: HasTitle
  stepLogin: SettingsStepLoginStrings
  tabs: SettingsTabsStrings
  secretKeyModal: SecretKeyModalStrings
  secretKeyVerification: SecretKeyVerificationStrings
  mutations: SettingsMutationsStrings
  emailNotifications: EmailNotifications
  webhooks: Webhooks
  payments: Payments
  multiLanguage: MultiLanguage
}
