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
          title: string
          numberOfResponsesAndAttachments: string
          estimatedTime: string
          estimatedTimeReference: string
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
        navigateAwayPrompt: {
          title: string
          description: string
          confirmButtonText: string
        }
        progressModalContent: string
        menuItem: {
          csvOnly: string
          csvWithAttachments: string
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
