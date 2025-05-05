import { CreateModal } from '.'

export const enSG: CreateModal = {
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
  },
  details: {
    name: {
      label: 'Form name',
      message: 'It is advised to use a shorter, more succinct form name.',
    },
    type: {
      label: 'What type of form do you need?',
      storage: {
        title: 'Storage mode form',
        subtitle:
          'Collect responses from individual respondents. Ideal for one-way submissions.',
      },
      mrf: {
        title: 'Multi-respondent form',
        subtitle:
          'Collect responses from multiple respondents in a single workflow. Ideal for sequential submissions.',
      },
    },
    notifications: {
      label: 'Notifications for new responses',
      description:
        'All email addresses below will be notified. Ensure that the inboxes can support the same data classification.',
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
    declaration:
      'If I lose my Secret Key, I cannot activate my form or access any responses to it',
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
  },
}
