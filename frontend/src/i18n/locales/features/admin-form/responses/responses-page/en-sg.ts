import { ResponsesResponsesPage } from '.'

export const enSG: ResponsesResponsesPage = {
  errors: {
    formRetrievalError:
      'There was an error retrieving your form. Please try again later.',
  },
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
          description:
            'Separate zip files will be downloaded, <b>one for each response</b>. You can adjust the date range before proceeding.',
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
          successMessages: {
            allResponses: 'All responses have been downloaded successfully.',
            allResponsesWithAttachments:
              'All responses and attachments have been downloaded successfully.',
            partialSuccessWithAttachments:
              '**{successCount}** {count, plural, =1 {response and attachment has} other {responses and attachments have}} been downloaded successfully, refer to the downloaded CSV file for more details',
            partialSuccess:
              '**{successCount}** {count, plural, =1 {response has} other {responses have}} been downloaded successfully, refer to the downloaded CSV file for more details',
          },
          errorMessages: {
            withAttachments:
              '**{errorCount}** {count, plural, =1 {response and attachment} other {responses and attachments}} could not be downloaded.',
            withoutAttachments:
              '**{errorCount}** {count, plural, =1 {response} other {responses}} could not be downloaded.',
          },
        },
        content: {
          title: 'Downloading...',
          percentCompleted: '% completed',
          stopDownload: 'Stop download',
        },
      },
      responsesTable: {
        headers: {
          number: '#',
          responseId: 'Response ID',
          timestamp: 'Timestamp',
          email: 'Email',
          paidAmount: 'Paid Amount (S$)',
          fees: 'Fees (S$)',
          netAmount: 'Net Amount (S$)',
          payoutDate: 'Payout Date',
        },
        status: {
          payoutPending: 'Pending',
        },
        mrf: {
          responseTimestamp: 'Response timestamp',
          pendingResponseAt: 'Pending response at',
          workflowStatus: 'Workflow status',
          reminders: 'Reminders',
          statusTrackingLink: 'Status tracking link',
        },
        sendReminderButton: {
          sendReminder: 'Send reminder',
          reminderSent: 'Reminder sent',
        },
      },
      submissionSearchbarPlaceholder: 'Search by response ID',
      downloadButton: {
        label: 'Download options',
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
        toasts: {
          noResponses: 'No responses to download',
          partialSuccess:
            'Partial success. {successCount}/{expectedCount} {count, plural, =1 {response was} other {responses were}} decrypted. {errorCount} failed.',
          success:
            'Success. {successCount}/{expectedCount} {count, plural, =1 {response was} other {responses were}} decrypted.',
          failedToStart: 'Failed to start download. Please try again later.',
          downloadCanceled: 'Responses download has been canceled.',
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
