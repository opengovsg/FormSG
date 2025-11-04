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
    notForMRF: string
    input: {
      label: string
      description: string
    }
    limitLessThanCurrent: string
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
