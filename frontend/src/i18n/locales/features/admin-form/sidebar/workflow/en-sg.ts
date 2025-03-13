import {
  CONDITIONAL_ROUTING_CSV_PARSE_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_DUPLICATE_OPTIONS_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_EMAILS_OPTIONS_MISSING_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_INVALID_CSV_FORMAT_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE,
} from '~shared/constants'

import { Workflow } from '.'

export const enSG: Workflow = {
  title: 'Add workflow',
  respondentBlock: {
    stepRespondent: 'Respondent in this step',
    anyone: 'Anyone who has access to your form',
    select: 'Select a respondent',
    fieldsToFill: 'Fields to fill',
    clickToEdit: 'Click to edit',
  },
  dynamicRespondent: {
    title: 'An email field from the form',
    required: 'Please select a field.',
    mustBeEmail: 'Field is not an email field',
    select: 'Select a field',
  },
  conditionalRouting: {
    title: 'Emails assigned to options in a dropdown field',
    addEmailsToOptions: 'Add emails to options',
    validation: {
      noField: 'Please select a field.',
      notDropdown: 'Field is not an dropdown field',
    },
    modals: {
      deleteStep: {
        title: 'Delete step',
        description:
          'Are you sure you want to delete this step? This action cannot be undone.',
        confirm: 'Yes, delete step',
        cancel: "No, don't delete",
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
          download: {
            templateCreated:
              'We have created a CSV template with the options from the field you selected.',
            pleaseDownload:
              'Please download the CSV template and add the emails for each option.',
            button: 'Download and edit CSV template',
            howto: {
              title: 'How to use the CSV template:',
              option: {
                title: 'Option',
                explanation: 'This contains all the options from your field.',
                notice:
                  'Do not edit, reorder or delete anything in this column.',
              },
              email: {
                title: 'Email(s)',
                explanation:
                  'Add the emails to send the form to for each option.',
                notice: 'Separate multiple email(s) with a comma.',
              },
              imageCaption: 'How to set up your CSV',
            },
          },
          nextButton: 'Next: Upload CSV file',
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
      },
    },
    errors: {
      respondentType: {
        required: 'Please select a respondent type',
        invalid: 'The selected respondent type is invalid',
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
    placeholder: 'Select field(s) from your form',
  },
  approvals: {
    title: 'Approvals',
    yesNoDeleted:
      'This Yes/No field was deleted, please select another Yes/No field',
    notRequired: 'Approval not required in this step',
    toggle: {
      label: 'This respondent is an approver',
      description:
        'If they select Yes, the form continues to the next step. If they select No, it stops here.',
      tooltip:
        'Use this for steps that involve any type of decision, such as reviews or endorsements',
      placeholder: 'Select a Yes/No field from your form',
    },
    validation: {
      noField: 'Please select a Yes/No field',
      fieldAlreadyUsed:
        'The selected field has been assigned to another step. Please choose a different field',
      fieldNotAssignedToUser:
        'The selected Yes/No field has not been assigned to this respondent',
    },
    addStep: 'Add step',
    complete: {
      prefix:
        'When the workflow is complete, email notifications can be sent to respondents and other parties. Set up',
      link: 'email notifications',
      suffix: 'in Settings.',
    },
  },
}
