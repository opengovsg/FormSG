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
    stepRespondentRedesign: string
    anyone: string
    anyoneRedesign: string
    select: string
    selectRedesign: string
    fieldsToFill: string
    clickToEdit: string
  }
  dynamicRespondent: {
    title: string
    required: string
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
    tooltipRedesign: string
    label: string
    labelRedesign: string
    placeholder: string
    placeholderRedesign: string
  }
  approvals: {
    title: string
    yesNoDeleted: string
    notRequired: string
    toggle: {
      label: string
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
  completionEmail: {
    title: string
    divider: string
  }
}
