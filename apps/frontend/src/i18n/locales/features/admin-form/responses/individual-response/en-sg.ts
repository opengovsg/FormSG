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
      sentBack:
        'Sent back from Step {fromStepNumber} to {step}{stepName}{actor}',
      remarks: 'Remarks',
    },
    reassignButton: 'Reassign',
    sendBackButton: 'Send back',
    addAssigneeModal: {
      title: 'Assign new people to this step',
      description:
        'We’ll email them a link to complete this step. People already assigned to this step can still respond.',
      label: 'Email addresses of new people',
      requiredEmail: 'Enter at least one email address',
      invalidEmail: 'Enter a valid email',
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
      label: 'Email addresses of who to notify',
      confirm: 'Stop workflow',
      toastSuccess: 'The workflow was successfully stopped.',
    },
    sendBackModal: {
      title: 'Send back to an earlier step',
      description:
        'We’ll email the people on that step a new link to amend their answers. Answers given so far stay filled in. Every step after it will need to be completed again.',
      stepLabel: 'Send back to',
      remarksLabel: 'Remarks (optional)',
      remarksDescription: 'Included in the email to the people on that step.',
      remarksTooLong: 'Remarks must be {max} characters or fewer',
      confirm: 'Send back',
      toastSuccess: 'The response was sent back to Step {stepNumber}.',
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
