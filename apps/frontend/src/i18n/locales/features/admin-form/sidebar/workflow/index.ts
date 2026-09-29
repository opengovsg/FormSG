export * from './en-sg'

interface CompletionPeekText {
  title: string
  subtitle: string
}

interface CsvColumnText {
  title: string
  explanation: string
  notice: string
}

interface StepLoginText {
  title: string
  types: {
    nil: string
    myInfo: string
    cp: string
    sp: string
    sgid: string
    sgidMyInfo: string
  }
  free: string
  newSubmissionsOnly: string
  badges: {
    collectsNric: string
    collectsUen: string
    onlyListedNrics: string
    onlyListedUens: string
    oneResponseEach: string
  }
  whitelist: {
    nricTitle: string
    uenTitle: string
    nricDescription: string
    uenDescription: string
    savesWithStep: string
    removedWithStep: string
    empty: string
  }
  editor: {
    collectNric: string
    collectUen: string
    collectNricDescription: string
    collectUenDescription: string
    singleSubmission: string
    singleSubmissionDescription: string
    esrvcIdLabel: string
    esrvcIdDescription: string
    esrvcIdPlaceholder: string
    myInfoRemovedOne: string
    myInfoRemovedMany: string
    undo: string
    esrvcIdChange: string
    esrvcIdSharedWith: string
    esrvcIdSharedByEvery: string
    esrvcIdSavesWithStep: string
    closeFormToEdit: string
    legacyProvider: string
    keepSingpassStep: string
    myInfoInOtherStep: string
    myInfoNeedsSingpassStep: string
  }
  esrvcIdModal: {
    title: string
    description: string
    descriptionShared: string
    stepName: string
    cancel: string
    confirm: string
  }
  noSteps: {
    heading: string
    fieldsToFill: string
    myInfoNeedsSingpassOne: string
    myInfoNeedsSingpassMany: string
    saved: string
  }
}

export interface Workflow {
  aria: {
    deleteWorkflow: string
  }
  title: string
  respondentBlock: {
    stepRespondent: string
    stepRespondentRedesign: string
    anyone: string
    anyoneRedesign: string
    select: string
    selectRedesign: string
    fieldsToFill: string
    clickToEdit: string
  }
  staticRespondent: {
    invalidEmailsRedesign: string
  }
  dynamicRespondent: {
    title: string
    required: string
    requiredRedesign: string
    mustBeEmail: string
    mustBeEmailRedesign: string
    select: string
  }
  conditionalRouting: {
    title: string
    addEmailsToOptions: string
    addEmailsToOptionsRedesign: string
    validation: {
      noField: string
      noFieldRedesign: string
      notDropdown: string
      notDropdownRedesign: string
    }
    modals: {
      deleteStep: {
        title: string
        description: string
        confirm: string
        cancel: string
      }
      deleteWorkflow: {
        title: string
        description: string[]
        confirm: string
        cancel: string
      }
      deleteFirstStep: {
        title: string
        description: string[]
        confirm: string
        cancel: string
      }
      closeFormFirst: {
        title: string
        description: string
        confirm: string
        cancel: string
      }
      closeFormFirstToEdit: {
        title: string
        description: string
        confirm: string
        cancel: string
      }
      deleteMapping: {
        title: string
        description: string
        confirm: string
        cancel: string
      }
      addMapping: {
        step1: {
          title: string
          titleRedesign: string
          nextButton: string
          download: {
            templateCreated: string
            pleaseDownload: string
            button: string
            howto: {
              title: string
              option: CsvColumnText
              email: CsvColumnText
              imageCaption: string
            }
          }
          carousel: {
            caption1: string
            caption2: string
            caption3: string
            caption4: string
            caption5: string
          }
        }
        step2: {
          title: string
          confirm: string
          description: {
            prefix: string
            csv: string
            suffix: string
          }
        }
        stepReplace: {
          title: string
          confirm: string
          description: {
            info: string
            warning: string
            info1: string
            info2: string
          }
        }
      }
    }
    errors: {
      respondentType: {
        required: string
        requiredRedesign: string
        invalid: string
        invalidRedesign: string
      }
      csv: {
        required: string
        addEmailsBeforeSave: string
        mismatchedOptions: string
        missingData: string
        invalidFormat: string
        duplicateOptions: string
        parse: string
      }
    }
  }
  questions: {
    tooltip: string
    label: string
    labelRedesign: string
    placeholder: string
    placeholderRedesign: string
    autoAddHelperTextRedesign: string
  }
  emptyStates: {
    noEmailField: string
    noEmailFieldAction: string
    noDropdownField: string
    noDropdownFieldAction: string
    noYesNoField: string
    noYesNoFieldAction: string
    noFields: string
    noFieldsMyInfoOnly: string
    noFieldsAction: string
  }
  approvals: {
    title: string
    yesNoDeleted: string
    notRequired: string
    toggle: {
      label: string
      labelRedesign: string
      description: string
      descriptionRedesign: string
      tooltip: string
      placeholder: string
    }
    validation: {
      noField: string
      noFieldRedesign: string
      fieldAlreadyUsed: string
      fieldNotAssignedToUser: string
      fieldNotAssignedToUserRedesign: string
    }
    addStep: string
    complete: {
      prefix: string
      prefixRedesign: string
      link: string
      suffix: string
    }
  }
  stepName: {
    label: string
  }
  guidedMode: {
    label: string
  }
  guidedHints: {
    stepName: string
    respondent: string
    approvals: string
  }
  skipGuidance: {
    modal: {
      title: string
      bodyWithSteps: string
      bodyWithoutSteps: string
      confirm: string
      cancel: string
    }
  }
  welcome: {
    header: string
    stepOne: string
    whatNext: string
    cta: string
  }
  intro: {
    header: string
    subheader: string
    guided: string
    manual: string
  }
  guided: {
    continue: string
    back: string
    cancel: string
    done: string
  }
  webhookEnabledNoMoreSteps: string
  paymentEnabledNoSteps: string
  completionEmail: {
    title: string
    divider: string
  }
  completionPeek: {
    stepOneDone: CompletionPeekText
    laterStepDone: CompletionPeekText
    emailSetUp: CompletionPeekText
    statusTracking: CompletionPeekText
    guidedSetupFinished: CompletionPeekText
    actions: {
      declineAnotherStep: string
      addAnotherStep: string
      continue: string
      finish: string
    }
  }
  stepLogin: StepLoginText
}
