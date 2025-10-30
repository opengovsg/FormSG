import { ResponsesIndividualResponse } from '.'

export const enSG: ResponsesIndividualResponse = {
  backToList: 'Back to list',
  nextSubmission: 'Next submission',
  previousSubmission: 'Previous submission',
  secretKeyVerification: {
    ctaText: 'Unlock responses',
    label: 'Enter or upload Secret Key',
  },
  downloadAttachmentsAsZip:
    'Download {attachmentSize, plural, =1 {# attachment} other {# attachments}} as .zip',
  responseLinkLabel: 'Response link',
  labels: {
    responseId: 'Response ID',
    timestamp: 'Timestamp',
  },
  paymentSection: {
    headers: {
      payment: 'Payment',
      payout: 'Payout to bank account',
    },
    paymentStatusLabel: {
      partiallyRefunded: 'Partially refunded',
      fullyRefunded: 'Fully refunded',
      disputed: 'Disputed',
    },
    tooltipLabel: `This is when money collected gets deposited into your bank account.
        Depending on payment method, payouts happen 1 - 3 working days after a respondent makes payment.`,
    paymentDataItemPdfDownloadLabel: 'Download as PDF',
  },
  paymentDataView: {
    fields: {
      paymentStatus: 'Payment status',
      payer: 'Payer',
      proofOfPayment: 'Proof of Payment',
      paymentIntentId: 'Payment intent ID',
      paymentAmount: 'Payment amount',
      productService: 'Product/service',
      paymentDateTime: 'Payment date and time',
      transactionFee: 'Transaction fee',
      payoutId: 'Payout ID',
      payoutDateTime: 'Payout date and time',
    },
  },
  mrf: {
    workflowStep: 'Step {currentStep} of {totalSteps}',
  },
  individualResponseNavbar: {
    printAriaLabel: 'Print',
  },
  decryptedAttachment: {
    aria: 'Download file',
  },
}
