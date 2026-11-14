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

export interface Workflow {
  aria: {
    deleteWorkflow: string
  }
  title: string
  respondentBlock: {
    stepRespondent: string
    anyone: string
    select: string
    fieldsToFill: string
    clickToEdit: string
  }
  staticRespondent: {
    invalidEmails: string
  }
  dynamicRespondent: {
    title: string
    required: string
    mustBeEmail: string
    select: string
  }
  conditionalRouting: {
    title: string
    addEmailsToOptions: string
    validation: {
      noField: string
      notDropdown: string
    }
    modals: {
      deleteStep: {
        title: string
        description: string
        confirm: string
        cancel: string
        closeFormFirst: string
        deletedFieldsIntro: string
        failed: string
      }
      guidedDeleteWorkflow: {
        pickerTitle: string
        pickerDescription: string
        keepCorppass: string
        chooseEsrvcId: string
        noEsrvcId: string
        deletesWorkflow: string
        keepProvider: string
        keepNone: string
        deletedFieldsIntro: string
        keepAllFields: string
        resetRestrictions: string
        failed: string
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
        invalid: string
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
    label: string
    placeholder: string
    autoAddHelperText: string
    stepOneOnlyHelperText: string
    loginFieldsHelperText: string
  }
  stepLogin: {
    title: string
    singpass: string
    corppass: string
    stepQuestion: string
    formQuestion: string
    noLogin: string
    singpassDescription: string
    legacySingpassDescription: string
    corppassDescription: string
    esrvcIdLabel: string
    esrvcIdPlaceholder: string
    esrvcIdWhitespace: string
    closeFormToEdit: string
    inactiveLabel: string
    tabs: { fields: string; approvals: string; login: string }
    historicalResponsesKept: string
    publishErrors: { title: string; description: string }
    settings: {
      description: string
      editWorkflow: string
      addStep: string
      notEnabled: string
      closeFormToEdit: string
      saved: string
      saveFailed: string
      restrictionsFailed: string
      confirmSwitchFirst: string
      checkBeforeSaving: string
      deleteNotice: string
      unassignNotice: string
      ariaLabelName: string
    }
    unassignedNotice: string
    fieldTags: { assignedToStep: string; providerOnly: string }
    saveErrors: {
      restrictionsParsing: string
      restrictionsFailed: string
      stepFailed: string
    }
    restrictions: {
      singleSubmission: string
      whitelistTitle: string
      whitelistDescription: string
      downloadSample: string
      invalidCsvHeader: string
      unreadableCsv: string
      checkingCsv: string
    }
    switchConfirmation: {
      noAuthentication: string
      titleTurnOff: string
      titleSwitch: string
      assignedField: string
      deleteBodyTurnOff: string
      deleteBodySwitch: string
      unassignBodyTurnOff: string
      unassignBodySwitch: string
      affectedRules: string
      deleteNote: string
      unassignNote: string
      cancel: string
      confirmAssign: string
      confirmDeleteTurnOff: string
      confirmUnassignTurnOff: string
      confirmDeleteSwitch: string
      confirmUnassignSwitch: string
    }
  }
  addField: {
    fields: string
    email: string
    dropdown: string
    yesNo: string
    saveFailed: string
  }
  approvals: {
    title: string
    yesNoDeleted: string
    notRequired: string
    toggle: {
      label: string
      description: string
      placeholder: string
    }
    validation: {
      noField: string
      fieldAlreadyUsed: string
      fieldNotAssignedToUser: string
    }
    addStep: string
    complete: {
      prefix: string
      link: string
      suffix: string
    }
  }
  stepName: {
    label: string
    placeholderStepOne: string
    placeholderLaterStep: string
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
  legacyWebhookEnabledNoMoreSteps: string
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
}
