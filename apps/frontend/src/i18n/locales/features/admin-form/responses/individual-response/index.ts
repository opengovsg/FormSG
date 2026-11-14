export * from './en-sg'

export interface ResponsesIndividualResponse {
  secretKeyVerification: {
    ctaText: string
    label: string
  }
  downloadAttachmentsAsZip: string
  responseLinkLabel: string
  previousResponse: string
  nextResponse: string
  statusTrackingLinkLabel: string
  responsesTab: string
  activityTab: string
  workflowActions: {
    whoIsNotifiedLabel: string
    whoIsNotifiedNone: string
    requireFullReview: string
    reviewNotNeeded: string
    tooltips: {
      remind: string
      addAssignee: string
      sendBack: string
      void: string
    }
    currentState: {
      currentStep: string
      pending: string
      assignees: string
      completed: string
      rejected: string
      voided: string
    }
    stopButton: string
    remindButton: string
    reminderModal: {
      title: string
      description: string
      confirm: string
    }
    activityLog: {
      title: string
      stepNumber: string
      stepNameLabel: string
      submitted: string
      stepSubmitted: string
      stepApproved: string
      stepRejected: string
      assigneeAdded: string
      reminderTriggered: string
      stopped: string
      notificationRecipients: string
      sentBack: string
      fixStep: string
      nextStepRecipients: string
      sentBackRecipients: string
      sentBackTarget: string
      addedAssignees: string
      reminderRecipients: string
      formAdmin: string
      remarks: string
    }
    reassignButton: string
    sendBackButton: string
    fixStepButton: string
    fixingStep: string
    addAssigneeModal: {
      currentlyAssignedLabel: string
      noCurrentAssignees: string
      title: string
      description: string
      label: string
      requiredEmail: string
      invalidEmail: string
      alreadyAssigned: string
      confirm: string
      toastSuccess: string
    }
    stopModal: {
      title: string
      description: string
      label: string
      confirm: string
      toastSuccess: string
    }
    fixStepModal: {
      title: string
      description: string
      stepLabel: string
      recipientsLabel: string
      stepOneEmailLabel: string
      stepOneEmailDescription: string
      remarksLabel: string
      remarksDescription: string
      remarksTooLong: string
      confirm: string
      toastSuccess: string
    }
    sendBackModal: {
      recipientsLabel: string
      title: string
      description: string
      stepLabel: string
      stepOneEmailLabel: string
      stepOneEmailDescription: string
      remarksLabel: string
      remarksDescription: string
      remarksTooLong: string
      keepFilledLabel: string
      keepFilledYes: string
      keepFilledNo: string
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
