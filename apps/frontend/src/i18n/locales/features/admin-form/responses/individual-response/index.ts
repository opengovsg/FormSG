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
      stepSent: string
      actorClause: string
      assigneeAdded: string
      reminderTriggered: string
      reminderSent: string
      stopped: string
      notificationRecipients: string
      sentBack: string
      remarks: string
    }
    reassignButton: string
    addAssigneeModal: {
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
    sendBackButton: string
    sendBackModal: {
      title: string
      description: string
      stepLabel: string
      remarksLabel: string
      remarksDescription: string
      remarksTooLong: string
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
