export * from './en-sg'

export interface ResponsesIndividualResponse {
  secretKeyVerification: {
    ctaText: string
    label: string
  }
  downloadAttachmentsAsZip: string
  responseLinkLabel: string
  statusTrackingLinkLabel: string
  workflowActions: {
    whoIsNotifiedLabel: string
    whoIsNotifiedNone: string
    stopButton: string
    stopModal: {
      title: string
      description: string
      notifyHeading: string
      confirm: string
      toastSuccess: string
    }
  }
  paymentSection: {
    paymentStatusLabel: {
      partiallyRefunded: string
      fullyRefunded: string
      disputed: string
    }
    tooltipLabel: string
    paymentDataItemPdfDownloadLabel: string
  }
  decryptedAttachment: {
    aria: string
  }
}
