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
        'Turn off "Include PDF responses" in all email fields',
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
        'turn off "Include PDF Responses" in all email fields.',
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
      bulkTransactionRate: 'Bulk transaction rates',
      useBulkTransactionRates:
        'To request bulk transaction rates for your payments, use',
      thisForm: 'this form',
      contactForAssistance: 'to contact us for assistance.',
      defaultTransactionRatesWarning:
        'Without this step, you will be charged default transaction rates.',
      acknowledgeWarningText:
        'I understand that I will be paying default transaction rates, unless I have requested bulk transaction rates and received confirmation',
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
