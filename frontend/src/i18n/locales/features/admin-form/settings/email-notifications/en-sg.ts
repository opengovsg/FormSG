export const enSG = {
  title: 'Email notifications',
  header: {
    closeFormFirst:
      'To change email recipients, close your form to new responses.',
    noEmailsForPaymentForms: `Email notifications for payment forms are not available in FormSG. You can configure them using [Plumber]({url}).`,
  },
  section: {
    mrf: {
      selectRecipient:
        'Select who to notify when the form and/or workflow is complete:',
      respondents: {
        step1: {
          label: 'Respondent in Step 1',
          placeholder: 'Select an email field from your form',
        },
        stepN: {
          label: {
            overall: 'Other respondents in your workflow',
            each: 'Respondent(s) in Step {stepNumber}',
          },
          placeholder: 'Select respondents from your form',
        },
        others: {
          label: 'Others',
          tooltipText:
            "Include the admin's email to inform them whenever a workflow is completed",
          description: 'Separate multiple email addresses with a comma',
        },
      },
    },
    regular: {
      label: 'Notifications for new responses',
      info: 'Notify the following email addresses when a responses is submitted',
      description: 'Separate multiple email addresses with a comma',
      respondentCopyLabel:
        'Allow respondents to receive a copy of their submission',
      customiseEmailLabel: 'Customise an email acknowledgement to respondents',
    },
    modal: {
      headerMrf: 'Edit action email',
      infoMrf:
        "Customise the email sent to respondents when it's their turn to fill in the form",
      headerEncrypt: 'Edit email acknowledgement',
      infoEncrypt:
        'Customise the email respondents will receive after submitting your form',
      subjectTitle: 'Subject',
      subjectError: 'Email subject cannot be empty',
      senderNameTitle: 'Sender name',
      senderNameError: 'Sender name cannot be empty',
      emailBodyTitle: 'Email body',
      emailBodyPlaceholder:
        'Include instructions or a message for your respondents',
    },
  },
}
