import { ResponsesIndividualResponse } from '.'

export const enSG: ResponsesIndividualResponse = {
  secretKeyVerification: {
    ctaText: 'Unlock responses',
    label: 'Enter or upload Secret Key',
  },
  downloadAttachmentsAsZip:
    'Download {attachmentSize, plural, =1 {# attachment} other {# attachments}} as .zip',
  responseLinkLabel: 'Response link',
  previousResponse: 'Previous response',
  nextResponse: 'Next response',
  statusTrackingLinkLabel: 'View',
  responsesTab: 'Responses',
  activityTab: 'Activity',
  workflowActions: {
    whoIsNotifiedLabel: 'Who will be notified',
    whoIsNotifiedNone: 'No one will be notified.',
    stopButton: 'Stop',
    remindButton: 'Remind',
    reminderModal: {
      title: 'Send a reminder',
      description: 'Remind the people who need to respond.',
      confirm: 'Send reminder',
    },
    activityLog: {
      title: 'Activity log',
      stepNumber: 'Step {stepNumber}',
      stepNameLabel: ' · {name}',
      submitted: '{step} submitted',
      stepSubmitted: '{step}{stepName} submitted',
      stepApproved: '{step}{stepName} approved',
      stepRejected: '{step}{stepName} rejected',
      stepSent: '{step}{stepName} sent to {recipients}',
      actorClause: ' by {actor}',
      assigneeAdded: '{emails} added to {step}{stepName}{actor}',
      reminderTriggered: 'Reminder triggered for {step}{stepName}{actor}',
      reminderSent: 'Reminder for {step}{stepName} sent to {recipients}',
      stopped: 'Workflow stopped{actor}',
      notificationRecipients: 'Notification recipients',
    },
    reassignButton: 'Reassign',
    addAssigneeModal: {
      title: 'Assign new people to this step',
      description:
        'We’ll email them a link to complete this step. People already assigned to this step can still respond.',
      label: 'Email addresses of new people',
      requiredEmail: 'Enter at least one email address',
      invalidEmail: 'Please enter a valid email',
      alreadyAssigned:
        '{emails} {count, plural, one {is} other {are}} already assigned to this step.',
      confirm: 'Assign new people',
      toastSuccess:
        '{count, plural, one {The new person can} other {The new people can}} now respond to this step.',
    },
    stopModal: {
      title: 'Stop this workflow',
      description:
        'No one will be able to respond to any more steps. You can still view and download responses already submitted.',
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
