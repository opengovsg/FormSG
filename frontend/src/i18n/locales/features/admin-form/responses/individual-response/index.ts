export * from './en-sg'

export interface ResponsesIndividualResponse {
  backToList: string
  nextSubmission: string
  previousSubmission: string
  secretKeyVerification: {
    ctaText: string
    label: string
  }
  downloadAttachmentsAsZip: string
  responseLinkLabel: string
  labels: {
    responseId: string
    timestamp: string
  }
  paymentSection: {
    headers: {
      payment: string
      payout: string
    }
    paymentStatusLabel: {
      partiallyRefunded: string
      fullyRefunded: string
      disputed: string
    }
    tooltipLabel: string
    paymentDataItemPdfDownloadLabel: string
  }
  paymentDataView: {
    fields: {
      paymentStatus: string
      payer: string
      proofOfPayment: string
      paymentIntentId: string
      paymentAmount: string
      productService: string
      paymentDateTime: string
      transactionFee: string
      payoutId: string
      payoutDateTime: string
    }
  }
  mrf: {
    workflowStep: string
  }
  individualResponseNavbar: {
    printAriaLabel: string
  }
  decryptedAttachment: {
    aria: string
  }
}
