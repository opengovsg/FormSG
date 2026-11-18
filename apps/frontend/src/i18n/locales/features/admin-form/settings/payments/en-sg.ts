import { Payments } from '.'

export const enSG: Payments = {
  title: 'Payments',
  businessInfo: {
    gstRegistrationNumber: 'GST Registration Number',
    businessAddress: 'Business Address',
  },
  gstToggle: {
    label: 'GST applicable',
    description: 'GST will be mentioned in proof of payment',
  },
  paymentUnsupportedMsg: {
    shortDescription: 'Payments are only available in storage mode',
    longDescription:
      'Respondents can now make payment for fees or services directly on your form. This feature is only available in storage mode.',
    learnMore: 'Learn more about payments',
    // TODO [MRF-CUTOVER]: Remove cutover copy after cutover.
    cutoverShortDescription:
      'Payments are only available in the legacy version of FormSG',
    cutoverLongDescription:
      'Respondents can make payment for fees or services directly on your form.',
    cutoverDuplicateLink: 'Duplicate your form',
    cutoverDuplicateSuffix: 'to use it.',
  },
  stripeConnectBtn: {
    connect: 'Connect my Stripe account',
    disconnect: 'Disconnect Stripe',
  },
  disabledRationaleText: {
    genericRationale: {
      toEnable: 'To enable payment fields,',
      removeAdminEmail: 'Remove all recipients from email notifications',
      turnOffPdfResponses:
        'Turn off "Include a copy of their responses" in all Email fields',
      disableSingleSubmission: 'Disable only one submission per NRIC/FIN/UEN',
    },
    adminEmailsPresent: {
      removeToEnable: 'To enable payment fields, remove all recipients from',
      emailNotifications: 'email notifications',
    },
    singleSubmission: {
      disableSingleSubmission: 'To enable payment fields, disable',
      singleSubmissionPerNricFinUen: 'only one submission per NRIC/FIN/UEN',
    },
    pdfResponseEnabled: {
      toEnable: 'To enable payment fields,',
      disablePdfResponses:
        'turn off "Include a copy of their responses" in all Email fields.',
    },
  },
  beforeConnectionInstructions: {
    invalidDomain:
      'Your Stripe account could not be connected because it was created with a non-whitelisted email domain. Try reconnecting an account that was created with a whitelisted email domain.',
    testMode:
      'You are currently in test mode. You can choose to skip connecting a Stripe account after clicking the button below.',
    setupGuide: {
      read: 'Read',
      ourGuide: 'our guide',
      setupOrConnectStripeText:
        'to set up a Stripe account. If your agency already has a Stripe account, you can connect it to this form.',
    },
    bulkTransactionText: {
      bulkTransactionRate: 'Discounted rates',
      useBulkTransactionRates:
        'To request discounted rates for your form, contact',
      contactForAssistance: 'for assistance.',
      defaultTransactionRatesWarning:
        'Without this step, you will be charged the default transaction rates.',
      acknowledgeWarningText:
        'I understand that I will be paying the default transaction rates, unless I have requested discounted rates and received confirmation.',
    },
  },
  afterConnectionInfo: {
    genericPaymentsError:
      'Something went wrong when validating the connected Stripe account.',
    stripeAccountConnected: 'Your Stripe account is connected to this Form.',
    noPaymentCapabilities:
      'The connected account does not have the ability to process payments.',
    testModeStripeAccountConnected:
      'Stripe account connected. Payments made on this form will only show in test mode in your Stripe account.',
    testModeStripeConnectionSkipped: 'You are connected to a test account.',
  },
  paymentsAccountInformation: {
    label: 'Target Account ID',
    labelDescription: 'This is the account ID connected to this form.',
  },
}
