export * from './en-sg'

export interface CreateModal {
  title: {
    setup: string
    duplicate: string
  }
  errors: {
    responseMode: {
      required: string
      invalid: string
    }
    useWizardWithinContext: string
    noSingpassInMrf: string
  }
  details: {
    name: {
      label: string
      message: string
    }
    type: {
      label: string
      storage: {
        title: string
        subtitle: string
      }
      mrf: {
        title: string
        subtitle: string
      }
    }
    notifications: {
      label: string
      description: string
    }
    create: string
  }
  secretKey: {
    title: string
    message: {
      preamble1: string
      preamble2: {
        prefix: string
        warning: string
      }
    }
    tooltip: {
      copyKey: string
      copied: string
    }
    download: string
    declaration: string
    confirm: string
    email: {
      filename: string
      subject: string
      body: string
    }
  }
  emailFormRecipient: {
    placeholder: string
  }
}
