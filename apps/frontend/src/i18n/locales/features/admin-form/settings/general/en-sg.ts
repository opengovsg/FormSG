export const enSG = {
  title: 'General',
  status: {
    supplySingpassEServiceId:
      'This form cannot be activated until a valid e-service ID is entered in the Singpass section.',
    noEmailsInMRF:
      'Email confirmation is not supported in multi-respondent forms. Please remove email confirmations from email fields before activating your form.',
    description: {
      prefix: 'Your form is ',
      suffix: ' to new responses',
      open: 'OPEN',
      closed: 'CLOSED',
    },
    ariaLabel: 'Toggle form status',
  },
  limit: {
    label: 'Set a response limit',
    input: {
      label: 'Maximum number of responses allowed',
      description:
        'Your form will automatically close once it reaches the set limit.',
    },
    toast: {
      successStorageMode:
        'Your form will now automatically close on the {submissionLimit} submission.',
      successMrf:
        'Your form will now automatically close on the {submissionLimit} started workflow.',
      successRemoved: 'The submission limit on your form is removed.',
    },
    limitLessThanCurrent:
      'Submission limit must be greater than current submission count ({currentResponseCount})',
  },
  expiry: {
    label: 'Set a form closing date',
    input: {
      label: 'Closing date and time',
      timeLabel: 'Expiry time',
      description:
        'Your form will automatically close at the selected date and time (SGT).',
    },
    toast: {
      success: 'Your form will now automatically close on {closeAt}.',
      successRemoved: 'The expiry date on your form is removed.',
    },
    dateInThePast: 'Expiry date must be in the future',
    invalidTime: 'Please enter a valid time',
  },
  customisation: {
    closedFormMessage: 'Set message for closed form',
  },
  saveDraft: {
    label: 'Enable saving of draft responses',
    description:
      "Respondents can save what they've filled in and continue later on the same browser.",
  },
  captcha: {
    label: 'Enable human verification (reCAPTCHA)',
    description:
      'Respondents may need to complete an image challenge to submit the form.',
  },
  issueNotifications: {
    label: 'Receive email notifications for issues reported by respondents',
    description:
      'You will receive a maximum of one email per form, per day if there are any issues reported.',
  },
  singpass: {
    mrfFirstStep:
      'Only the first step in a workflow will have Singpass authentication enabled.',
  },
}
