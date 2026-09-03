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
  // TODO [MRF-CUTOVER]: Remove after cutover. Copy for the legacy (storage-mode)
  // setup screen and the escape-hatch link shown while the flag is on.
  legacy: {
    title: string
    description: string
  }
  escapeHatch: {
    reasons: {
      payments: string
      children: string
      webhooksV1: string
    }
    prefix: string
    linkText: string
    suffix: string
  }
  origin: {
    topicSentence: string
    q1: {
      label: string
      options: {
        new: string
        existing: string
      }
    }
    q2: {
      label: string
      options: {
        digitalFormbuilder: string
        digitalEmail: string
        digitalDocument: string
        digitalSpreadsheet: string
        paper: string
        others: string
      }
    }
    otherInputLabel: string
    errors: {
      q1Required: string
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
