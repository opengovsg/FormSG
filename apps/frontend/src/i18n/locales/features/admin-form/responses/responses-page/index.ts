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
          downloadTitle: string
          filesToDownload: string
          filtersApplyToDownload: string
          csvAppliesTableView: string
          csvDescription: string
          csvText: string
          pdfsText: string
          attachmentsText: string
          andText: string
          attachmentsDescription: string
          pdfsDescription: string
          downloadVersionLabel: string
          zipDescription: string
          howFilesAreSaved: string
          numberOfResponses: string
          estimatedTime: string
          estimatedTimeReference: string
          intensiveOperationWarning: {
            title: string
            reduceDownloadsWithFilters: string
            ensureInternetAndStorage: string
          }
          noResponsesInSelectedDateRange: string
          startDownload: string
        }
        modal: {
          progressMessage: string
          zipProgressMessage: string
        }
      }
      progressModal: {
        completeScreen: {
          downloadComplete: string
          allFilesDownloaded: string
          backToResponses: string
          allResponsesSomeFilesFailed: string
          someResponsesSomeFilesFailed: string
          failedFilesTitle: string
          failedFileItem: string
          otherFailedFiles: string
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
      searchResponsesPlaceholder: string
      filterMenu: {
        dateRange: string
        columns: string
        filterApplied: string
        filterPlaceholder: string
        clearFilter: string
        clearAllFilters: string
      }
      views: {
        countUnavailable: string
        loadingCount: string
        allResponses: string
        saveAsNewView: string
        saveView: string
        viewLimitReached: string
        viewName: string
        viewNamePlaceholder: string
        viewNameRequired: string
        viewNameMinLength: string
        viewNameMaxLength: string
        deleteView: string
        deleteViewTitle: string
        deleteViewDescription: string
        deleteViewSuccess: string
        saveViewSuccess: string
      }
      sortMenu: {
        column: string
        direction: string
        responseNumber: string
        ascending: string
        descending: string
      }
      toolbar: {
        filter: string
        sort: string
        columns: string
        all: string
      }
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
        toast: {
          storageFull: string
          startFailed: string
        }
      }
      unlockedResponses: {
        noMatchingResponses: string
        recentOnly: string
        recentOnlyWithView: string
        showMore: string
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
