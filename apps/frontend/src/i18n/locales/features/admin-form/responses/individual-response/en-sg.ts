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
    stopButton: 'Stop',
    reassignButton: 'Reassign',
    addAssigneeModal: {
      title: 'Add assignee',
      description:
        'Add someone to respond to this step. Current assignees can still respond.',
      label: 'Add assignee',
      invalidEmail: 'Please enter a valid email',
      alreadyAssigned:
        '{emails} {count, plural, one {is} other {are}} already assigned to this step.',
      confirm: 'Add assignee',
      toastSuccess:
        '{count, plural, one {The new assignee was} other {The new assignees were}} successfully added.',
    },
    stopModal: {
      title: 'Stop this workflow?',
      description:
        'No further actions can be taken, and its status will change to Stopped. Responses will stay available to view and download.',
      notifyHeading: 'Select who to notify when the workflow is stopped',
      confirm: 'Stop workflow',
      toastSuccess: 'The workflow was successfully stopped.',
    },
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
