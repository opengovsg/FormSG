export * from './en-sg'

export interface ResponsesResponsesPage {
  errors: {
    formRetrievalError: string
  }
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
          description: string
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
          successMessages: {
            allResponses: string
            allResponsesWithAttachments: string
            partialSuccessWithAttachments: string
            partialSuccess: string
          }
          errorMessages: {
            withAttachments: string
            withoutAttachments: string
          }
        }
        content: {
          title: string
          percentCompleted: string
          stopDownload: string
        }
      }
      responsesTable: {
        headers: {
          number: string
          responseId: string
          timestamp: string
          email: string
          paidAmount: string
          fees: string
          netAmount: string
          payoutDate: string
        }
        status: {
          payoutPending: string
        }
        mrf: {
          responseTimestamp: string
          pendingResponseAt: string
          workflowStatus: string
          reminders: string
          statusTrackingLink: string
        }
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
          csvOnly: string
          csvWithAttachments: string
        }
        toasts: {
          noResponses: string
          partialSuccess: string
          success: string
          failedToStart: string
          downloadCanceled: string
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
