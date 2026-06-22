import { enSG as fields } from './fields'
import { enSG as payment } from './payment'
import { enSG as table } from './table'
import { PublicForm } from '.'

export const enSG: PublicForm = {
  backendErrors: {
    verification: {
      sessionExpired: 'Your session has expired, please refresh and try again.',
      otpExpired: 'Your OTP has expired, please request for a new one.',
      otpRetryExceeded:
        'You have entered too many invalid OTPs. Please request for a new OTP and try again.',
      wrongOtp: 'Wrong OTP.',
      waitForOtp:
        'You must wait for {waitForOtpSeconds} seconds between each OTP request.',
      otpRequestCountExceeded:
        'You have requested too many OTPs. Please refresh and try again.',
      invalidNumber:
        'This phone number does not seem to be valid. Please try again with a valid phone number.',
      mailSend:
        'Sorry, we were unable to send the email out at this time. Please ensure that the email entered is correct. If this problem persists, please refresh and try again later.',
      outdatedForm:
        'Sorry, this form is outdated. Please refresh your browser to get the latest version of the form',
    },
    submission: {
      saveFailed: 'Failed to save submission. Please try again later.',
      loginFailed:
        'Something went wrong with your login. Please try logging in and submitting again.',
      myInfo: {
        expired: 'MyInfo verification expired, please refresh and try again.',
        failed: 'MyInfo verification failed.',
        unavailable: 'MyInfo verification unavailable, please try again later.',
      },
      captcha: {
        connection:
          'Could not verify captcha. Please submit again in a few minutes.',
        incorrect: 'Captcha was incorrect. Please submit again.',
        missing: 'Captcha was missing. Please refresh and submit again.',
      },
      turnstile: {
        connection:
          'Error connecting to Turnstile server. Please submit again in a few minutes.',
        incorrectParameters:
          'Incorrect Turnstile parameters. Please refresh and submit again.',
        missingChallenge:
          'Missing Turnstile challenge. Please refresh and submit again.',
      },
      validation: {
        invalidData:
          'Invalid data was found. Please check your responses and submit again.',
        submissionTooLarge:
          'Submission too large to be saved. Please reduce the size of your submission and try again.',
        invalidSubmission:
          'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
        formUpdated:
          'The form has been updated. Please refresh and submit again.',
      },
      files: {
        uploadFailed:
          'Could not upload attachments for submission. For assistance, please contact the person who asked you to fill in this form.',
        totalSizeExceeded:
          'Total attachment size exceeds maximum file size limit. Please reduce your total attachment size and try again.',
        virusScanFailed: 'Virus scan failed. Please try again.',
        cleanFileDownloadFailed:
          'Attempt to download clean file failed. Please try again.',
      },
      mrf: {
        missingSubmitterId:
          'Failed to retrieve submitter ID. Please try again.',
        invalidLink:
          'The link you used is no longer valid. Please contact the form admin that gave you this link.',
        invalidWorkflowType:
          'Invalid workflow type encountered. Please contact the form admin and try again later.',
        expectedResponseNotFound:
          'Response for the Yes/No field for this approval step is not found',
      },
      payment: {
        invalidSettings:
          "The form's payment settings are invalid. Please contact the admin of the form to rectify the issue.",
        pendingSubmissionSaveFailed:
          'Could not save pending submission. For assistance, please contact the person who asked you to fill in this form.',
        intentCreateFailed:
          'There was a problem creating the payment intent. Please try again.',
        documentUpdateFailed:
          'There was a problem updating the payment document. Please try again.',
        settingsUpdated:
          'The payment settings in this form have been updated. Please refresh and try again.',
      },
      generic: 'Something went wrong. Please try again.',
    },
  },
  errors: {
    notAvailable: 'This form is not available.',
    notFound: 'Form not found',
    deleted: 'This form is no longer active',
    private:
      'If you require further assistance, please contact the agency that gave you the form link.',

    submissionSecretKeyInvalid: {
      title: 'Invalid form link',
      header: 'This form link is no longer valid.',
      message:
        'A submission may have already been made using this link. If you require further assistance, please contact the agency that gave you the form link.',
    },

    myinfo:
      'Your Myinfo details could not be retrieved. Refresh your browser and log in, or try again later.',
    submitFailure:
      'An error occurred whilst processing your submission. Please refresh and try again.',
    verifiedFieldExpired:
      'Your verified fields have expired. Please verify those fields again.',
  },
  components: {
    header: {
      estTime:
        '{estTime, plural, =1 {# min} other {# mins}} estimated time to complete',
    },
    submitButton: {
      loadingText: 'Submitting',
      visuallyHidden: 'End of form.',
      preventSubmission: 'Submission disabled',
      proceedToPay: 'Proceed to pay',
      submitNow: 'Submit now',
    },
    saveDraft: {
      toast: {
        success:
          'Draft saved. Reopen this link in this browser to resume filling it.',
        restoredAllFields: 'Your draft has been successfully restored.',
        restoredOnlyUnchangedFields:
          'Some fields were not restored as the form has been updated.',
        previewNoDraftSaved:
          'Since you are in preview mode, there is no draft saved.',
      },
      tooltip: {
        default: 'Save a draft',
        lastSaved: 'Last saved: {lastSavedDateTimeString}',
      },
      button: {
        label: 'Save a draft',
      },
    },
    table,
    fields,
    payment,
    feedbackBlock: {
      title: {
        payment: 'How was your experience making payment on this form?',
        general: 'How was your form filling experience today?',
      },
      rating: {
        label: 'Form feedback rating',
        error: 'Please select a rating',
      },
      commentPlaceholder: 'Tell us more about your experience',
      submitButton: 'Submit feedback',
    },
    instructions: {
      title: 'Instructions',
    },
    duplicatePaymentModal: {
      title: 'Proceed to pay again?',
      description: {
        existingPayment:
          'We noticed a successful payment made on this form by your email address.',
        viewPreviousPayment: 'View your previous payment ↪',
        confirm: 'Do you wish to proceed to make another payment?',
      },
      actions: {
        submit: 'Proceed to pay',
        submitting: 'Submitting',
      },
    },
    formAuth: {
      loginButton: 'Log in with {authType}',
      authType: {
        singpass: 'Singpass',
        singpassCorporate: 'Singpass (Corporate)',
        singpassApp: 'Singpass app',
      },
    },
    formAuthMessage: {
      signIn: {
        singpass: 'Sign in with Singpass to access this form.\n',
        corporate: 'Corporate entity login is required for this form.\n',
        singpassApp: 'Sign in with the Singpass app to access this form.\n',
      },
      submitterId: {
        included: {
          singpass:
            'Your Singpass login ID <bold>will be included</bold> with your form submission.',
          corporate:
            'Your Singpass and Corppass login ID <bold>will be included</bold> with your form submission.',
        },
        notIncluded: {
          singpass:
            'Your Singpass login ID will <bold>not be included</bold> with your form submission.',
          corporate:
            'Your Singpass and Corppass login ID will <bold>not be included</bold> with your form submission.',
        },
      },
    },
    formFields: {
      prefillWarning: 'Some fields below have been pre-filled.',
    },
    formFieldsContainer: {
      error: 'Something went wrong',
    },
    formIssueFeedbackModal: {
      title: 'Report an issue',
      description:
        'Fill this in only <bold>if you are experiencing issues and are unable to submit this form</bold>. If you would like to provide feedback, you can do so after submitting the form.',
      fields: {
        issueLabel: 'Please describe the issue you encountered',
        contactLabel: 'Contact',
        emailPlaceholder: 'me@example.com',
      },
      actions: {
        submit: 'Send report',
      },
      toast: {
        preview:
          'Thank you for submitting your feedback! Since you are in preview mode, the feedback is not stored.',
        success: 'Thank you for submitting your feedback!',
      },
    },
    loadingTitle: {
      title: 'Loading title',
    },
    miniHeader: {
      mobileSectionSidebar: 'Mobile section sidebar',
    },
    formHeader: {
      logoutWithId: '{id} - Log out',
    },
    sectionSidebar: {
      skipToSection: 'Skip to section',
      formSections: 'Form sections',
      jumpToSection: 'Jump to form section',
      listOfSections: 'List of form section links',
      navigatedToSection: 'Navigated to section: {title}{description}',
    },
    sidebarLink: {
      navigateToSection: 'Navigate to section: ',
    },
    singleSubmissionModal: {
      title: 'Only one submission per NRIC/FIN/UEN allowed',
      logoutLoading: 'Logging out',
      backToLogin: 'Back to Singpass log in',
    },
  },
}
