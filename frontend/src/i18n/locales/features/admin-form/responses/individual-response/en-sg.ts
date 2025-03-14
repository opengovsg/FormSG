import { ResponsesIndividualResponse } from '.'

export const enSG: ResponsesIndividualResponse = {
  backToList: 'Back to list',
  secretKeyVerification: {
    ctaText: 'Unlock responses',
    label: 'Enter or upload Secret Key',
  },
  downloadAttachmentsAsZip: 'Download {attachmentSize} attachment(s) as .zip',
  responseLinkLabel: 'Response link',
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
}
