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
    notForMRF: 'Response limits cannot be applied for multi-respondent forms.',
    input: {
      label: 'Maximum number of responses allowed',
      description:
        'Your form will automatically close once it reaches the set limit. Enable reCAPTCHA to prevent spam submissions from triggering this limit.',
    },
    limitLessThanCurrent:
      'Submission limit must be greater than current submission count ({currentResponseCount})',
  },
  customisation: {
    label: 'Set message for closed form',
  },
  captcha: {
    label: 'Enable reCAPTCHA',
    description:
      'If you expect non-English-speaking respondents, they may have difficulty understanding the reCAPTCHA selection instructions.',
  },
  issueNotifications: {
    label: 'Receive email notifications for issues reported by respondents',
    description:
      'You will receive a maximum of one email per form, per day if there are any issues reported.',
  },
}
