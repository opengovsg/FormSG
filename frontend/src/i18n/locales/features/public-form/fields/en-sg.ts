import { Fields } from '.'

export const enSG: Fields = {
  yesNo: {
    yes: 'Yes',
    no: 'No',
  },
  email: {
    validation: {
      domainDisallowed:
        'The entered email does not belong to an allowed email domain',
    },
  },
  verification: {
    button: {
      label: {
        verify: 'Verify',
        verified: 'Verified',
      },
    },
    modal: {
      email: {
        title: 'Verify your email',
        description:
          'An email with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
      },
      mobile: {
        title: 'Verify your mobile number',
        description:
          'An SMS with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
      },
    },
  },
}
