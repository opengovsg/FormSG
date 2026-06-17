export * from './en-sg'

export interface CreateFormModal {
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
    noMyInfoChildrenInMrf: string
  }
  details: {
    name: {
      label: string
      message: string
    }
    type: {
      label: string
      description: string
      storage: {
        title: string
        subtitle: string
        optionDescriptionItems: {
          supportWebhooks: string
          sensitivity: string
        }
      }
      mrf: {
        title: string
        subtitle: string
        optionDescriptionItems: {
          supportApprovalWorkflow: string
          sensitivity: string
        }
      }
      email: {
        description: string
        link: string
        continuedDescription: string
      }
    }
    notifications: {
      label: string
      description: string
    }
    create: string
    next: string
  }
  origin: {
    question: string
    options: {
      paper: string
      'digital-new': string
      'digital-email': string
      'digital-document': string
      'digital-spreadsheet': string
      'digital-formbuilder': string
      others: string
    }
    otherInputLabel: string
    errors: {
      atLeastOne: string
      otherRequired: string
      otherMaxLength: string
    }
    cta: {
      next: string
      back: string
    }
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
    declaration: {
      text: string
      aria: string
    }
    confirm: string
    email: {
      filename: string
      subject: string
      body: string
    }
    warning: {
      beforeUnload: string
      popState: string
    }
    mailSecretKey: {
      aria: string
    }
  }
  emailFormRecipient: {
    placeholder: string
  }
  emailModeFeedback: {
    header: string
    description: string
    question: {
      title: string
      options: {
        sensitiveHigh: string
      }
    }
    next: string
  }
  emailModeCreation: {
    header: string
    formName: {
      label: string
    }
    notifications: {
      label: string
      description: string
    }
    create: string
  }
}
