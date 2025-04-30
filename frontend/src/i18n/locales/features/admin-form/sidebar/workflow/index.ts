export * from './en-sg'

interface CsvColumnText {
  title: string
  explanation: string
  notice: string
}

export interface Workflow {
  title: string
  respondentBlock: {
    stepRespondent: string
    anyone: string
    select: string
    fieldsToFill: string
    clickToEdit: string
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
    tooltip: string
    label: string
    placeholder: string
  }
  approvals: {
    title: string
    yesNoDeleted: string
    notRequired: string
    toggle: {
      label: string
      description: string
      tooltip: string
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
}
