import { type HasTitle } from '..'

export * from './en-sg'

export interface General extends HasTitle {
  status: {
    supplySingpassEServiceId: string
    noEmailsInMRF: string
    description: {
      prefix: string
      suffix: string
      open: string
      closed: string
    }
    ariaLabel: string
  }
  limit: {
    label: string
    input: {
      label: string
      description: string
    }
    toast: {
      successStorageMode: string
      successMrf: string
      successRemoved: string
    }
    limitLessThanCurrent: string
  }
  expiry: {
    label: string
    input: {
      label: string
      description: string
    }
    toast: {
      success: string
      successRemoved: string
    }
    dateInThePast: string
  }
  customisation: {
    closedFormMessage: string
  }
  saveDraft: {
    label: string
    description: string
  }
  captcha: {
    label: string
    description: string
  }
  issueNotifications: {
    label: string
    description: string
  }
  singpass: {
    mrfFirstStep: string
  }
}
