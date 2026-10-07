import { ResponsesIndividualResponse } from '.'

export const enSG: ResponsesIndividualResponse = {
  secretKeyVerification: {
    ctaText: 'Unlock responses',
    label: 'Enter or upload Secret Key',
  },
  downloadAttachmentsAsZip:
    'Download {attachmentSize, plural, =1 {# attachment} other {# attachments}} as .zip',
  responseLinkLabel: 'Response link',
  statusTrackingLinkLabel: 'View',
  workflowActions: {
    whoIsNotifiedLabel: 'Who will be notified',
    whoIsNotifiedNone: 'No one will be notified.',
  },
  paymentSection: {
    paymentStatusLabel: {
      partiallyRefunded: 'Partially refunded',
      fullyRefunded: 'Fully refunded',
      disputed: 'Disputed',
    },
    tooltipLabel: `This is when money collected gets deposited into your bank account.
        Depending on payment method, payouts happen 1 - 3 working days after a respondent makes payment.`,
    paymentDataItemPdfDownloadLabel: 'Download as PDF',
  },
  decryptedAttachment: {
    aria: 'Download file',
  },
}
