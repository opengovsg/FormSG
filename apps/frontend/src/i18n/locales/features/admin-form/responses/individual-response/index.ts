export * from './en-sg'

export interface ResponsesIndividualResponse {
  secretKeyVerification: {
    ctaText: string
    label: string
  }
  downloadAttachmentsAsZip: string
  responseLinkLabel: string
  statusTrackingLinkLabel: string
  workflowStop: {
    remindButton: string
    reassignButton: string
    stopButton: string
    whoIsNotifiedLabel: string
    whoIsNotifiedNone: string
    reminderModal: {
      title: string
      description: string
      confirm: string
    }
    addAssigneeModal: {
      title: string
      description: string
      label: string
      invalidEmail: string
      alreadyAssigned: string
      confirm: string
      toastSuccess: string
    }
    stopModal: {
      title: string
      description: string
      notifyHeading: string
      confirm: string
      toastSuccess: string
    }
    activityLog: {
      title: string
      submitted: string
      stepNumber: string
      stepNameLabel: string
      stepCompleted: string
      stepCompletedSentTo: string
      stepApproved: string
      stepApprovedSentTo: string
      stepNotApproved: string
      assigneeAdded: string
      reminderSent: string
      stopped: string
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
