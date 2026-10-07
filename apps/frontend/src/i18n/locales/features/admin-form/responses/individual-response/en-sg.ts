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
  workflowStop: {
    remindButton: 'Remind',
    reassignButton: 'Reassign',
    stopButton: 'Stop',
    whoIsNotifiedLabel: 'Who will be notified',
    whoIsNotifiedNone: 'No one will be notified.',
    reminderModal: {
      title: 'Send a reminder',
      description: 'Remind the people who need to respond.',
      confirm: 'Send reminder',
    },
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
    activityLog: {
      title: 'Activity log',
      submitted: 'Response submitted.',
      stepNumber: 'Step {stepNumber}',
      // Leading space: follows the bold step number, e.g. "Step 1 (Applicant)".
      stepNameLabel: ' ({name})',
      stepCompleted: '<bold>{step}</bold>{stepName} completed.',
      stepCompletedSentTo:
        '<bold>{step}</bold>{stepName} completed. Sent to <bold>{recipients}</bold> to respond.',
      stepApproved: '<bold>{step}</bold>{stepName} approved.',
      stepApprovedSentTo:
        '<bold>{step}</bold>{stepName} approved. Sent to <bold>{recipients}</bold> to respond.',
      stepNotApproved: '<bold>{step}</bold>{stepName} not approved.',
      assigneeAdded:
        '<bold>{emails}</bold> added to <bold>{step}</bold>{stepName} by <bold>{actor}</bold>.',
      reminderSent:
        'Reminder sent to <bold>{recipients}</bold> by <bold>{actor}</bold>.',
      stopped: 'Workflow stopped by <bold>{actor}</bold>.',
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
