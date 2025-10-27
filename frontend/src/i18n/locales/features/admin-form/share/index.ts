export * from './en-sg'

export interface Share {
  modal: {
    header: string
  }
  tabs: {
    link: string
    template: string
    embed: string
  }
  formActivation: {
    message: string
  }
  formLink: {
    label: string
    copyAriaLabel: string
    openAriaLabel: string
  }
  template: {
    label: string
    copyAriaLabel: string
  }
  embed: {
    label: string
    copyAriaLabel: string
    fallbackText: string
    here: string
    poweredBy: string
  }
  goLink: {
    label: string
    description: string
    claim: string
    claimAriaLabel: string
    copyAriaLabel: string
    success: {
      text: string
    }
    errors: {
      validation: string
      alreadyExists: string
      unexpected: string
    }
  }
}
