import { enSG as emailNotifications } from './email-notifications'
import { enSG as general } from './general'
import { enSG as payments } from './payments'
import { enSG as webhooks } from './webhooks'

export const enSG = {
  general,
  singpass: {
    title: 'Singpass',
  },
  tabs: {
    newBadge: 'New',
    multiLanguage: 'Multi-language',
  },
  secretKeyModal: {
    fieldLabel: 'Enter or upload Secret Key',
    uploadFromFileAriaLabel: 'Pass secret key from file',
    validation: {
      required: "Please enter the form's secret key",
      invalidSecretKey: 'The secret key provided is invalid',
    },
    placeholder: {
      dragging: 'Drop your Secret Key here',
      default: 'Enter or drop your Secret Key to continue',
    },
    ackLabel:
      'If I lose my key, I will not be able to activate my form and all my responses will be lost permanently',
    activation: {
      modalTitle: 'Activate your form',
      submitButton: 'Activate form',
    },
    whitelistCsv: {
      modalTitle: 'Download CSV file of whitelisted NRIC/FIN/UEN(s)',
      submitButton: 'Download file',
    },
  },
  emailNotifications,
  webhooks,
  payments,
}
