export * from './en-sg'

export interface ResponsesResponsesPage {
  emptyResponses: {
    title: string
    subtitle: string
  }
  emailResponsesTab: {
    responsesToDate: string
    responsesNotStoredInEmailMode: string
  }
  storage: {
    unlockedResponses: {
      downloadWithAttachmentModal: {
        canceledScreen: {
          downloadStopped: string
          title: string
          backToResponses: string
        }
        confirmationScreen: {
          titleAttachmentsOnly: string
          titleResponsesAndAttachments: string
          attachmentsDescription: string
          numberOfResponses: string
          estimatedTime: string
          estimatedTimeReference: string
          filterResponsesCountHelperText: string
          intensiveOperationWarning: {
            title: string
            doNotUseIE: string
            ensureStrongNetworkConnectivity: string
            ensureEnoughDiskSpace: string
          }
          noResponsesInSelectedDateRange: string
          startDownload: string
        }
        modal: {
          progressMessage: string
        }
      }
      progressModal: {
        completeScreen: {
          downloadComplete: string
          backToResponses: string
        }
        content: {
          title: string
          percentCompleted: string
          stopDownload: string
        }
      }
      responsesTable: {
        sendReminderButton: {
          sendReminder: string
          reminderSent: string
        }
      }
      submissionSearchbarPlaceholder: string
      downloadButton: {
        label: string
        navigateAwayPrompt: {
          title: string
          description: string
          confirmButtonText: string
        }
        progressModalContent: string
        menuItem: {
          csv: string
          attachments: string
          pdfs: string
        }
      }
      unlockedResponses: {
        resultsFound: string
        responsesToDate: string
      }
    }
    storageResponsesTab: {
      secretKeyVerification: {
        ctaText: string
        label: string
      }
    }
  }
}
