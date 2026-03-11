import { EmergencyContact } from '.'

export const enSG: EmergencyContact = {
  modal: {
    header: 'Emergency contact',
    description:
      'Update your mobile number and verify it so we can contact you in the unlikely case of an urgent form issue. This number can be changed at any time in your user settings.',
  },
  contactNumber: {
    label: 'Mobile number',
    errors: {
      invalid: 'Please enter a valid mobile number',
    },
  },
  verification: {
    label: 'Verify your mobile number',
    description:
      'A text message with a verification code was just sent to you. The code will be valid for 10 minutes.',
    errors: {
      required: 'OTP is required.',
      numbersOnly: 'Only numbers are allowed.',
      invalid: 'Please enter a 6 digit OTP.',
    },
  },
}
