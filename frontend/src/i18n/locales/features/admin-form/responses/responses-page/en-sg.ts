import { ResponsesResponsesPage } from '.'

export const enSG: ResponsesResponsesPage = {
  emptyResponses: {
    title: "You don't have any responses yet.",
    subtitle: 'Try using {link} to send out your form links!',
  },
  emailResponsesTab: {
    responsesToDate:
      '{responsesCount, plural, =1 {response} other {responses}} to date',
    responsesNotStoredInEmailMode:
      'FormSG does not store responses in Email mode.',
  },
  storage: {
    unlockedResponses: {
      downloadWithAttachmentModal: {
        canceledScreen: {
          downloadStopped: 'Download stopped',
          title:
            'Your responses and attachments have not been downloaded successfully.',
          backToResponses: 'Back to responses',
        },
        confirmationScreen: {
          title: 'Download responses and attachments',
          numberOfResponsesAndAttachments:
            'Number of responses and attachments',
          estimatedTime: 'Estimated time',
          estimatedTimeReference: '30-50 mins per 1,000 responses',
          intensiveOperationWarning: {
            title:
              'Downloading many attachments can be an intensive operation.',
            doNotUseIE: 'Do not use Internet Explorer',
            ensureStrongNetworkConnectivity:
              'Ensure network connectivity is strong',
            ensureEnoughDiskSpace:
              'Ensure device has sufficient disk space for the download',
          },
          noResponsesInSelectedDateRange:
            'The date range you selected does not contain any responses. Please select a date range containing responses and try again.',
          startDownload: 'Start download',
        },
        modal: {
          progressMessage:
            'Up to {responsesCount} files are being downloaded into your destination folder. Navigating away from this page will stop the download.',
        },
      },
      progressModal: {
        completeScreen: {
          downloadComplete: 'Download complete',
          backToResponses: 'Back to responses',
        },
        content: {
          title: 'Downloading...',
          percentCompleted: '% completed',
          stopDownload: 'Stop download',
        },
      },
      responsesTable: {
        sendReminderButton: {
          sendReminder: 'Send reminder',
          reminderSent: 'Reminder sent',
        },
      },
      submissionSearchbarPlaceholder: 'Search by response ID',
      downloadButton: {
        navigateAwayPrompt: {
          title: 'Stop downloading responses?',
          description:
            'You are currently downloading form responses. The download will be aborted if you leave this page.',
          confirmButtonText: 'Yes, leave this page',
        },
        progressModalContent:
          '{dateRangeResponsesCount} responses are being processed. Navigating away from this page will stop the download.',
        menuItem: {
          csvOnly: 'CSV only',
          csvWithAttachments: 'CSV with attachments',
        },
      },
      unlockedResponses: {
        resultsFound: '{count, plural, =1 {result} other {results}} found',
        responsesToDate:
          '{count, plural, =1 {response} other {responses}} to date',
      },
    },
    storageResponsesTab: {
      secretKeyVerification: {
        ctaText: 'Unlock responses',
        label: 'Enter or upload Secret Key',
      },
    },
  },
}
