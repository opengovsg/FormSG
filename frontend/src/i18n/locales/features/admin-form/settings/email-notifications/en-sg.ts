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
      description: 'Separate multiple email addresses with a comma',
    },
  },
}
