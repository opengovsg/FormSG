import { HasTitle } from '..'

export * from './en-sg'

export interface Payments extends HasTitle {
  disabledRationaleText: {
    genericRationale: {
      toEnable: string
      removeAdminEmail: string
      turnOffPdfResponses: string
      disableSingleSubmission: string
    }
    adminEmailsPresent: {
      removeToEnable: string
      emailNotifications: string
    }
    singleSubmission: {
      disableSingleSubmission: string
      singleSubmissionPerNricFinUen: string
    }
    pdfResponseEnabled: {
      toEnable: string
      disablePdfResponses: string
    }
  }
  beforeConnectionInstructions: {
    invalidDomain: string
    testMode: string
    setupGuide: {
      read: string
      ourGuide: string
      setupOrConnectStripeText: string
    }
    bulkTransactionText: {
      bulkTransactionRate: string
      useBulkTransactionRates: string
      thisForm: string
      contactForAssistance: string
      defaultTransactionRatesWarning: string
      acknowledgeWarningText: string
    }
  }
  afterConnectionInfo: {
    genericPaymentsError: string
    stripeAccountConnected: string
    noPaymentCapabilities: string
    testModeStripeAccountConnected: string
    testModeStripeConnectionSkipped: string
  }
  paymentsAccountInformation: {
    label: string
    labelDescription: string
  }
  businessInfo: {
    gstRegistrationNumber: string
    businessAddress: string
  }
  gstToggle: {
    label: string
    description: string
  }
  paymentUnsupportedMsg: {
    shortDescription: string
    longDescription: string
    learnMore: string
  }
  stripeConnectBtn: {
    connect: string
    disconnect: string
  }
}
