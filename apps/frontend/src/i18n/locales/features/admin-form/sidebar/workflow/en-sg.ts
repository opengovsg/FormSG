import {
  CONDITIONAL_ROUTING_CSV_PARSE_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_DUPLICATE_OPTIONS_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_EMAILS_OPTIONS_MISSING_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_INVALID_CSV_FORMAT_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE,
} from 'formsg-shared/constants/errors'

import { Workflow } from '.'

export const enSG: Workflow = {
  title: 'Add workflow',
  aria: {
    deleteWorkflow: 'Delete workflow',
  },
  respondentBlock: {
    stepRespondent: 'Respondent in this step',
    stepRespondentRedesign: 'Who should fill in this step?',
    anyone: 'Anyone who has access to your form',
    anyoneRedesign: 'Anyone with your form link can fill in Step 1.',
    select: 'Select a respondent',
    selectRedesign: 'Who should fill in this step?',
    fieldsToFill: 'Fields to fill',
    clickToEdit: 'Click to edit',
  },
  staticRespondent: {
    invalidEmailsRedesign:
      "Enter valid emails separated by commas, like me@example.com. Invalid emails won't be saved.",
  },
  dynamicRespondent: {
    title: 'An Email field from the form',
    required: 'Please select a field.',
    requiredRedesign: 'Select a field.',
    mustBeEmail: 'Field is not an Email field',
    mustBeEmailRedesign: 'Choose an Email field.',
    select: 'Select a field',
  },
  conditionalRouting: {
    title: 'Emails assigned to options in a Dropdown field',
    addEmailsToOptions: 'Add emails to options',
    addEmailsToOptionsRedesign: 'Assign emails to options',
    validation: {
      noField: 'Please select a field.',
      noFieldRedesign: 'Select a field.',
      notDropdown: 'Field is not a Dropdown field',
      notDropdownRedesign: 'Choose a Dropdown field.',
    },
    modals: {
      deleteStep: {
        title: 'Delete step',
        description:
          'Are you sure you want to delete this step? This action cannot be undone.',
        confirm: 'Yes, delete step',
        cancel: "No, don't delete",
        closeFormFirst:
          'Close your form before deleting a step that removes authentication fields.',
        deletedFieldsIntro:
          'This is the last step using its authentication provider. These fields will be deleted from your form:',
        failed: 'The step could not be deleted.',
      },
      guidedDeleteWorkflow: {
        pickerTitle: 'Choose authentication to keep',
        pickerDescription:
          'Your form will have one respondent after deleting the workflow. Choose which authentication it should keep.',
        keepCorppass: 'Keep Corppass authentication.',
        chooseEsrvcId: 'Choose the Corppass e-service ID to keep.',
        noEsrvcId: 'No e-service ID configured',
        deletesWorkflow: 'Deleting Step 1 deletes the entire workflow.',
        keepProvider:
          'All workflow steps, approvals and workflow routing will be removed. The form will keep {provider} authentication.',
        keepNone:
          'All workflow steps, approvals and workflow routing will be removed. The form will keep no authentication.',
        deletedFieldsIntro: 'These fields will be deleted from your form:',
        keepAllFields: 'All form fields will be kept.',
        resetRestrictions:
          'The original Step 1 eligibility list and one-response limit will be reset because its authentication provider is changing.',
        failed:
          'The workflow could not be deleted. Your changes have not been applied.',
      },
      deleteWorkflow: {
        title: 'Delete entire workflow',
        description: [
          'Responses already started will continue using the current workflow.',
          'If the form does not have a workflow, anyone with the link will be able to fill in every field.',
        ],
        confirm: 'Delete workflow',
        cancel: 'Cancel',
      },
      deleteFirstStep: {
        title: 'Deleting the first step removes the entire workflow',
        description: [
          'Responses already started will continue using the current workflow.',
          'If the form does not have a workflow, anyone with the link will be able to fill in every field.',
        ],
        confirm: 'Delete workflow',
        cancel: 'Cancel',
      },
      closeFormFirst: {
        title: 'Close your form first',
        description:
          'You can only delete your workflow when your form is closed to new responses.',
        confirm: 'Go to settings',
        cancel: 'Cancel',
      },
      closeFormFirstToEdit: {
        title: 'Close your form first',
        description:
          'You can only edit your workflow when your form is closed to new responses.',
        confirm: 'Go to settings',
        cancel: 'Cancel',
      },
      deleteMapping: {
        title: 'Delete CSV file',
        description:
          'Are you sure you want to delete this CSV file? This action cannot be undone.',
        confirm: 'Yes, delete CSV file',
        cancel: "No, don't delete",
      },
      addMapping: {
        step1: {
          title: 'Add emails to options',
          titleRedesign: 'Assign emails to options',
          download: {
            templateCreated:
              'We have created a CSV template with the options from the field you selected.',
            pleaseDownload:
              'Please download the CSV template and add the emails for each option.',
            button: 'Download and edit CSV',
            howto: {
              title: 'How to use the CSV',
              option: {
                title: 'OPTIONS',
                explanation: 'This contains all the options from your field.',
                notice:
                  'Do not edit, reorder or delete anything in this column.',
              },
              email: {
                title: 'EMAIL(S)',
                explanation:
                  'Add the emails to send the form to for each option.',
                notice: 'Separate multiple email(s) with a comma.',
              },
              imageCaption: 'How to set up your CSV',
            },
          },
          nextButton: 'Next: Upload CSV file',
          carousel: {
            caption1: 'Download and edit the CSV FormSG has created',
            caption2:
              'The CSV template includes options from your selected field',
            caption3: 'Enter emails for each option',
            caption4: 'Upload your updated CSV file',
            caption5: 'Save CSV file to update routing',
          },
        },
        step2: {
          title: 'Upload your completed CSV file',
          confirm: 'Save CSV file',
          description: {
            prefix: 'Please ensure that your file is saved in',
            csv: 'comma-separated values (.csv)',
            suffix: 'format.',
          },
        },
        stepReplace: {
          title: 'Replace your CSV file',
          confirm: 'Save CSV file',
          description: {
            info: 'Replacing the file will delete the existing CSV and update your dropdown options(s) and email routing.',
            warning: 'This action cannot be undone. ',
            info1: 'To assign multiple emails to an option,',
            info2: 'separate them with commas.',
          },
        },
      },
    },
    errors: {
      respondentType: {
        required: 'Please select a respondent type',
        requiredRedesign: 'Please choose who fills in this step',
        invalid: 'The selected respondent type is invalid',
        invalidRedesign: 'The selected option is invalid',
      },
      csv: {
        required: 'Please upload a CSV file',
        addEmailsBeforeSave:
          'You must add emails to options before saving this step.',
        mismatchedOptions: CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE,
        missingData: CONDITIONAL_ROUTING_EMAILS_OPTIONS_MISSING_ERROR_MESSAGE,
        invalidFormat: CONDITIONAL_ROUTING_INVALID_CSV_FORMAT_ERROR_MESSAGE,
        duplicateOptions: CONDITIONAL_ROUTING_DUPLICATE_OPTIONS_ERROR_MESSAGE,
        parse: CONDITIONAL_ROUTING_CSV_PARSE_ERROR_MESSAGE,
      },
    },
  },
  questions: {
    tooltip:
      'Respondent will only be able to fill the fields you have selected',
    label: 'Select field(s) for this respondent to fill',
    labelRedesign: 'Choose the fields this person fills in',
    placeholder: 'Select field(s) from your form',
    placeholderRedesign: 'Select fields from your form',
    autoAddHelperTextRedesign:
      'The approval field is added here automatically.',
    stepOneOnlyHelperText:
      'Your form only has MyInfo fields, which can only be used in the first step.',
    loginFieldsHelperText:
      'Your form only has Myinfo fields, which need a step whose login can fill them.',
  },
  stepLogin: {
    title: 'Login',
    enable: 'Enable Singpass authentication',
    enableDescription:
      'Respondents must log in with Singpass before filling in this step',
    singpass: 'Singpass',
    corppass: 'Corppass',
    esrvcIdLabel: 'e-service ID',
    esrvcIdPlaceholder: 'Enter Corppass e-service ID',
    esrvcIdWhitespace: 'e-service ID must not contain whitespace',
    closeFormToEdit: 'To change the login, close your form to new responses.',
    inactiveLabel: 'Singpass authentication',
    tabs: { fields: 'Fields to fill', approvals: 'Approvals', login: 'Login' },
    historicalResponsesKept: 'Historical responses will not be deleted.',
    publishErrors: {
      title: 'Finish authentication setup before publishing',
      description:
        'Configure matching authentication for these fields, or delete the unused fields.',
    },
    settings: {
      description: 'Manage authentication for each step in your workflow.',
      editWorkflow: 'Edit your full workflow ↗',
      notEnabled: 'Singpass authentication not enabled',
      closeFormToEdit: 'Close your form to change authentication settings.',
      saved: 'Authentication settings saved.',
      saveFailed: 'Unable to save settings.',
      restrictionsFailed:
        'The login was saved, but some Step 1 restrictions could not be saved. {message} Review the saved settings before trying again.',
      confirmSwitchFirst:
        'Confirm or cancel the authentication change before leaving this card.',
      checkBeforeSaving: 'Check the authentication settings before saving.',
      deleteNotice:
        'Confirmed fields will be deleted from the form when you save or navigate away.',
      unassignNotice:
        'Incompatible fields will be unassigned when you save or navigate away. They remain in the form.',
      ariaLabelName: 'authentication settings',
    },
    unassignedNotice:
      'Incompatible fields are unassigned in this draft. Confirmed field deletions apply only when you save or navigate away.',
    fieldTags: {
      assignedToStep: 'Assigned to Step {stepNumber}',
      providerOnly: '{provider} only',
    },
    saveErrors: {
      restrictionsParsing:
        'Wait for the eligible respondent list to finish checking.',
      restrictionsFailed:
        'The step was saved, but some Step 1 restrictions could not be saved. Check the current settings and try again.',
      stepFailed: 'The step could not be saved. Please try again.',
    },
    restrictions: {
      singleSubmission: 'Limit each unique NRIC/FIN/UEN to one response',
      whitelistTitle: 'Restrict form to eligible NRIC/FIN/UENs only',
      whitelistDescription:
        'Only NRIC/FIN/UENs in this list can submit a response. Upload a single-column CSV with the “Respondent” header.',
      downloadSample: 'Download a sample .csv file',
      invalidCsvHeader:
        'Your CSV file should only contain a single column with the header "Respondent".',
      unreadableCsv: 'Unable to read the CSV file.',
      checkingCsv: 'Checking CSV…',
    },
    switchConfirmation: {
      noAuthentication: 'no authentication',
      titleTurnOff: 'Turn off authentication',
      titleSwitch: 'Switch to {provider}',
      assignedField:
        '"{field}" needs {provider}. Switching this step to {provider} assigns it to this step.',
      deleteBodyTurnOff:
        'This is the only step using {current}. Turning off authentication means these {current} fields can no longer be used:',
      deleteBodySwitch:
        'This is the only step using {current}. Switching to {provider} means these {current} fields can no longer be used:',
      unassignBodyTurnOff:
        'These fields need {current}, so they cannot be filled in on a step without authentication:',
      unassignBodySwitch:
        'These fields need {current}, so they cannot be filled in on a step using {provider}:',
      affectedRules: 'References to these fields will also be removed from:',
      deleteNote:
        'These fields will be deleted from your form when you save this step or navigate away. Past responses will be kept.',
      unassignNote:
        'These fields will be unassigned from this step when you save or navigate away. They will stay in your form.',
      cancel: 'Cancel',
      confirmAssign: 'Switch to {provider} and assign field',
      confirmDeleteTurnOff: 'Delete fields and turn off',
      confirmUnassignTurnOff: 'Unassign fields and turn off',
      confirmDeleteSwitch: 'Delete fields and switch to {provider}',
      confirmUnassignSwitch: 'Unassign fields and switch to {provider}',
    },
  },
  addField: {
    fields: 'Add fields',
    email: 'Add an Email field',
    dropdown: 'Add a Dropdown field',
    yesNo: 'Add a Yes/No field',
    saveFailed:
      "This step couldn't be saved. Fix it, then add the field again.",
  },
  approvals: {
    title: 'Approvals',
    yesNoDeleted:
      'This Yes/No field was deleted, please select another Yes/No field',
    notRequired: 'Approval not required in this step',
    toggle: {
      label: 'Make this step an approval',
      labelRedesign: "Make this person approve what's been filled in so far",
      description:
        'If respondent selects Yes, the form is Approved and continues to the next step. If they select No, the form is Not approved and stops at this step.',
      descriptionRedesign:
        'If they reject the submission, the workflow stops here.',
      tooltip:
        'Use this for steps that involve any type of decision, such as reviews or endorsements. Decision will be shown on dashboard and tracking links.',
      placeholder: 'Select a field',
    },
    validation: {
      noField: 'Please select a Yes/No field',
      noFieldRedesign: 'Select a Yes/No field.',
      fieldAlreadyUsed:
        'The selected field has been assigned to another step. Please choose a different field',
      fieldNotAssignedToUser:
        'The selected Yes/No field has not been assigned to this respondent',
      fieldNotAssignedToUserRedesign:
        'The selected Yes/No field has not been assigned to this person',
    },
    addStep: 'Add step',
    complete: {
      prefix:
        'When the workflow is complete, email notifications can be sent to respondents and other parties. Set up',
      prefixRedesign:
        'When the workflow is done, email notifications can be sent to people and other parties. Set up',
      link: 'email notifications',
      suffix: 'in Settings.',
    },
  },
  stepName: {
    label: 'Step name',
    placeholderStepOne: 'e.g. Step 1, Applicant, Parent, Vendor, New request',
    placeholderLaterStep:
      "e.g. Step {stepNumber}, Staff, HOD approval, Applicant's acknowledgement",
  },
  guidedMode: {
    label: 'Guided setup',
  },
  guidedHints: {
    stepName: "Name this step, or keep it as 'Step {stepNumber}'.",
    respondent:
      'Choose who FormSG sends the form to in this step. You can always change this later.',
    approvals:
      'Choose what they do in this step. Most steps just need people to fill in fields.',
  },
  skipGuidance: {
    modal: {
      title: 'Skip guided setup?',
      bodyWithSteps:
        "You'll set up your workflow yourself. Any steps you've created so far will be kept. You can turn guided setup back on at any time.",
      bodyWithoutSteps:
        "You'll set up your workflow yourself. You can turn guided setup back on at any time.",
      confirm: 'Skip guided setup',
      cancel: 'Cancel',
    },
  },
  welcome: {
    header: "Let's start with Step 1",
    stepOne: 'Step 1 is what everyone who opens your form link fills in first.',
    whatNext:
      "You'll name the step and pick which fields they see. Then you can add more steps.",
    cta: "Let's go",
  },
  intro: {
    header: 'Start creating a workflow for your form',
    subheader:
      'Split your form into steps and send each one to a different person in sequence. Everyone only fills in their own part.',
    guided: 'Start with guided setup',
    manual: 'Set up manually',
  },
  guided: {
    continue: 'Continue',
    back: 'Back',
    cancel: 'Cancel',
    done: 'Done',
  },
  legacyWebhookEnabledNoMoreSteps:
    'Legacy webhooks only work with forms that have at most one workflow step. Turn off "Use legacy webhooks" in <webhookSettingsLink>webhook settings</webhookSettingsLink> to add more steps.',
  webhookEnabledNoMoreSteps:
    'Remove your webhook URL in <webhookSettingsLink>webhook settings</webhookSettingsLink> to add more steps.',
  paymentEnabledNoSteps:
    'Remove the payment field to add workflow steps. A form cannot have both a payment field and a workflow.',
  completionEmail: {
    title: 'Completion email',
    divider: 'END OF WORKFLOW',
  },
  completionPeek: {
    stepOneDone: {
      title:
        'Step 1 is the public-facing step. Anyone with your link starts here.',
      subtitle: 'Now add the steps that route to specific people.',
    },
    laterStepDone: {
      title: 'Nice, Step {stepNumber} is all set',
      subtitle: 'Would you like to add another step?',
    },
    emailSetUp: {
      title: "You've set up the completion email.",
      subtitle: 'Next, set up an extra workflow setting.',
    },
    statusTracking: {
      title: 'Your workflow is ready',
      subtitle:
        'Before you finish, you can let people check the status of their response.',
    },
    guidedSetupFinished: {
      title: "You've finished guided setup.",
      subtitle:
        'Use the Preview button on the top right to check what each step looks like.',
    },
    actions: {
      declineAnotherStep: "No, I'm done",
      addAnotherStep: 'Yes, add a step',
      continue: 'Continue',
      finish: 'Done',
    },
  },
}
