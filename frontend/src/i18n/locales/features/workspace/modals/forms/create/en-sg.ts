import { CreateFormModal } from '.'

export const enSG: CreateFormModal = {
  title: {
    setup: 'Set up your form',
    duplicate: 'Duplicate form',
  },
  errors: {
    responseMode: {
      required: 'Please select a form response mode',
      invalid: 'Invalid response mode',
    },
    useWizardWithinContext:
      'useCreateFormWizard must be used within a CreateFormWizardProvider component',
    noSingpassInMrf:
      'The form you are trying to duplicate has Singpass authentication which is not supported for Multi-respondent forms.',
    noMyInfoChildrenInMrf:
      'The form you are trying to duplicate has MyInfo Children field(s) which is not supported for Multi-respondent forms.',
  },
  details: {
    name: {
      label: 'Form name',
      message: 'It is advised to use a shorter, more succinct form name.',
    },
    type: {
      label: 'Number of respondents',
      description: 'How many respondents will fill up each form submission?',
      storage: {
        title: 'One respondent',
        subtitle:
          'Forms with just one respondent per submission support the following:',
        optionDescriptionItems: {
          supportSingpassMyinfo: 'Singpass & Myinfo',
          supportWebhooks: 'Webhooks for integrations',
          sensitivity:
            'Up to Confidential (Cloud-Eligible) and Sensitive (High) data',
        },
      },
      mrf: {
        title: 'Two or more respondents',
        subtitle:
          'Forms with two or more respondents per submission support the following:',
        optionDescriptionItems: {
          supportApprovalWorkflow: 'Approval workflows',
          supportEmailRouting: 'Email routing',
          sensitivity:
            'Up to Confidential (Cloud-Eligible) and Sensitive (High) data',
        },
      },
      email: {
        description:
          "We're phasing out Email mode in the coming months. Don't worry! Storage Mode already supports email functionalities. You can still",
        link: 'use it for now',
        continuedDescription: "but we'd love to hear why.",
      },
    },
    notifications: {
      label: 'Notifications for new responses',
      description:
        'All email addresses below will be notified. Ensure that inboxes can support the classification and sensitivity.',
    },
    create: 'Create form',
  },
  secretKey: {
    title: 'Your form has been created! Download your Secret Key to proceed.',
    message: {
      preamble1:
        "You will need this secret key to access this form's responses.",
      preamble2: {
        prefix: 'If you lose it, ',
        warning: 'all responses will be permanently lost',
      },
    },
    tooltip: {
      copyKey: 'Copy key',
      copied: 'Copied!',
    },
    download: 'Download key',
    declaration: {
      text: 'If I lose my Secret Key, I cannot activate my form or access any responses to it',
      aria: 'Storage mode form acknowledgement',
    },
    confirm: 'I have saved my Secret Key safely',
    email: {
      filename: 'Form Secret Key - {titleInputValue} - FormID({formId}).txt',
      subject: 'Shared Secret Key for {titleInputValue}',
      body: `
          Dear collaborator,

          I am sharing my form's secret key with you for safekeeping and backup. This is an important key that is needed to access all form responses.

          Form title: {titleInputValue}

          Secret key: {secretKey}

          All you need to do is keep this email as a record, and please do not share this key with anyone else.

          Thank you for helping to safekeep my form!`,
    },
    warning: {
      beforeUnload: 'You have not downloaded your Secret Key yet',
      popState:
        "You have not downloaded your Secret Key yet. You won't be able to access your form responses without it. Are you sure you want to leave?",
    },
    mailSecretKey: {
      aria: 'Email the secret key to someone',
    },
  },
  emailFormRecipient: {
    placeholder: 'Separate emails with a comma',
  },
  emailModeFeedback: {
    header: 'Before you get started',
    description:
      "We'd love to understand why you chose to create an Email mode form. This will help us ensure a smooth transition once we phase out Email mode.",
    question: {
      title: 'Why are you creating an Email mode form?',
      options: {
        sensitiveHigh: 'I need to collect Sensitive High data',
      },
    },
    next: 'Next: Set up your form',
  },
  emailModeCreation: {
    header: 'Set up your form in Email mode',
    formName: {
      label: 'Form name',
    },
    notifications: {
      label: 'Notifications for new responses',
      description:
        'All email addresses below will be notified. Learn more on [how to guard against email bounces]({GUIDE_PREVENT_EMAIL_BOUNCE}).',
    },
    create: 'Create form',
  },
}
