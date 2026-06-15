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
          label: 'Person in Step 1',
          placeholder: 'Select an email field from your form',
        },
        stepN: {
          label: {
            overall: 'Other people in your workflow',
            each: 'Person(s) in Step {stepNumber}',
          },
          placeholder: 'Select people from your form',
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
      info: 'Allow respondents to receive a copy of their submission',
      description: 'Separate multiple email addresses with a comma',
      statusTrackerInfo: 'Allow respondents to track their submission status',
      statusTrackerDescription: 'View a sample status tracking link',
    },
  },
}
