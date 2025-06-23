export * from './en-sg'

export interface ResponsesIndividualResponse {
  backToList: string
  secretKeyVerification: {
    ctaText: string
    label: string
  }
  downloadAttachmentsAsZip: string
  responseLinkLabel: string
  paymentSection: {
    paymentStatusLabel: {
      partiallyRefunded: string
      fullyRefunded: string
      disputed: string
    }
    tooltipLabel: string
    paymentDataItemPdfDownloadLabel: string
  }
}
