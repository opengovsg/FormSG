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
    stopButton: 'Void',
    requireFullReview: 'Require full review',
    reviewNotNeeded: 'Review not needed',
    tooltips: {
      remind: 'Remind the current assignees to respond.',
      addAssignee: 'Add someone who can complete this step.',
      sendBack: 'Ask someone at an earlier step to make changes.',
      void: 'Stop this response from going any further.',
    },
    currentState: {
      currentStep: 'Current step: Step {stepNumber}{stepName}',
      pending: 'Pending',
      assignees: 'Current assignees',
      completed: 'Completed',
      rejected: 'Rejected',
      voided: 'Voided',
    },
    remindButton: 'Remind',
    reminderModal: {
      title: 'Send a reminder',
      description: 'Remind the people who need to respond.',
      confirm: 'Send reminder',
    },
    activityLog: {
      title: 'Activity log',
      stepNumber: 'Step {stepNumber}',
      stepNameLabel: ' ({name})',
      submitted: '{step} submitted',
      stepSubmitted: '{step}{stepName} submitted',
      stepApproved: '{step}{stepName} approved',
      stepRejected: '{step}{stepName} rejected',
      assigneeAdded: 'Assignee added to {step}{stepName}',
      reminderTriggered: 'Reminder requested for {step}{stepName}',
      stopped: 'Response voided',
      notificationRecipients: 'Notification recipients',
      sentBack: 'Sent back (require full review)',
      fixStep: 'Sent back (review not needed)',
      nextStepRecipients: 'Next step: {step}{stepName} · Assigned to',
      sentBackRecipients: 'Sent back to {step}{stepName} · Assigned to',
      sentBackTarget: 'Sent back to {step}{stepName}',
      addedAssignees: 'Added assignees',
      reminderRecipients: 'Reminder recipients',
      formAdmin: '(Form admin)',
      remarks: 'Remarks',
    },
    reassignButton: 'Add assignee',
    sendBackButton: 'Send back',
    fixStepButton: 'Fix step',
    fixingStep:
      'Step {stepNumber} is being fixed. The response returns to Step {returnStepNumber} once it is submitted.',
    addAssigneeModal: {
      title: 'Add assignee',
      description:
        'We’ll email them a link to complete this step. People already assigned to this step can still respond.',
      label: 'Email addresses of new people',
      currentlyAssignedLabel: 'Currently assigned to {stepName}',
      noCurrentAssignees: 'No one is currently assigned to this step.',
      requiredEmail: 'Enter at least one email address',
      invalidEmail: 'Enter a valid email',
      alreadyAssigned:
        '{emails} {count, plural, one {is} other {are}} already assigned to this step.',
      confirm: 'Add assignee',
      toastSuccess:
        '{count, plural, one {The new person can} other {The new people can}} now respond to this step.',
    },
    stopModal: {
      title: 'Void this response',
      description:
        'No one will be able to respond to any more steps. You can still view and download responses already submitted.',
      label: 'Email addresses of who to notify',
      confirm: 'Void response',
      toastSuccess: 'The response was voided.',
    },
    fixStepModal: {
      title: 'Fix an earlier step',
      description:
        'Fix the selected step, then return to the current step. Keep existing approvals.',
      stepLabel: 'Step to fix',
      recipientsLabel: 'People in {stepName}',
      stepOneEmailLabel: 'Email address of who fills in Step 1',
      stepOneEmailDescription:
        'Step 1 has no set recipient, so we’ll email the link to this address.',
      remarksLabel: 'Remarks',
      remarksDescription: 'Included in the email to the people on that step.',
      remarksTooLong: 'Remarks must be {max} characters or fewer',
      confirm: 'Send back',
      toastSuccess:
        'The response was sent back to Step {stepNumber} without requiring full review.',
    },
    sendBackModal: {
      title: 'Send back to an earlier step',
      description: 'Complete the selected step and all steps after it again.',
      stepLabel: 'Send back to',
      recipientsLabel: 'People in {stepName}',
      stepOneEmailLabel: 'Email address of who fills in Step 1',
      stepOneEmailDescription:
        'Step 1 has no set recipient, so we’ll email the new link to this email address.',
      remarksLabel: 'Remarks',
      remarksDescription: 'Tell them what they need to fix.',
      remarksTooLong: 'Remarks must be {max} characters or fewer',
      keepFilledLabel: 'Should keep existing form fields filled?',
      keepFilledYes: 'Yes, keep filled',
      keepFilledNo: 'No, clear form fields',
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
