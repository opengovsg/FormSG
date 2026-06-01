import { Fields } from './fields'
import { Payment } from './payment'
import { Table } from './table'

export * from './en-sg'

export interface PublicForm {
  backendErrors: {
    verification: {
      sessionExpired: string
      otpExpired: string
      otpRetryExceeded: string
      wrongOtp: string
      waitForOtp: string
      otpRequestCountExceeded: string
      invalidNumber: string
      mailSend: string
      outdatedForm: string
    }
    submission: {
      saveFailed: string
      loginFailed: string
      myInfo: {
        expired: string
        failed: string
        unavailable: string
      }
      captcha: {
        connection: string
        incorrect: string
        missing: string
      }
      turnstile: {
        connection: string
        incorrectParameters: string
        missingChallenge: string
      }
      validation: {
        invalidData: string
        submissionTooLarge: string
        invalidSubmission: string
        formUpdated: string
      }
      files: {
        uploadFailed: string
        totalSizeExceeded: string
        virusScanFailed: string
        cleanFileDownloadFailed: string
      }
      mrf: {
        missingSubmitterId: string
        invalidLink: string
        invalidWorkflowType: string
        expectedResponseNotFound: string
      }
      generic: string
    }
  }
  errors: {
    notAvailable: string
    notFound: string
    deleted: string
    private: string

    submissionSecretKeyInvalid: {
      title: string
      header: string
      message: string
    }
    myinfo: string
    submitFailure: string
    verifiedFieldExpired: string
  }
  components: {
    header: {
      estTime: string
    }
    submitButton: {
      loadingText: string
      visuallyHidden: string
      preventSubmission: string
      proceedToPay: string
      submitNow: string
    }
    saveDraft: {
      toast: {
        success: string
        restoredAllFields: string
        restoredOnlyUnchangedFields: string
        previewNoDraftSaved: string
      }
      tooltip: {
        default: string
        lastSaved: string
      }
      button: {
        label: string
      }
    }
    table: Table
    fields: Fields
    payment: Payment
    feedbackBlock: {
      title: {
        payment: string
        general: string
      }
      rating: {
        label: string
        error: string
      }
      commentPlaceholder: string
      submitButton: string
    }
    instructions: {
      title: string
    }
    duplicatePaymentModal: {
      title: string
      description: {
        existingPayment: string
        viewPreviousPayment: string
        confirm: string
      }
      actions: {
        submit: string
        submitting: string
      }
    }
    formAuth: {
      loginButton: string
      authType: {
        singpass: string
        singpassCorporate: string
        singpassApp: string
      }
    }
    formAuthMessage: {
      signIn: {
        singpass: string
        corporate: string
        singpassApp: string
      }
      submitterId: {
        included: {
          singpass: string
          corporate: string
        }
        notIncluded: {
          singpass: string
          corporate: string
        }
      }
    }
    formFields: {
      prefillWarning: string
    }
    formFieldsContainer: {
      error: string
    }
    formIssueFeedbackModal: {
      title: string
      description: string
      fields: {
        issueLabel: string
        contactLabel: string
        emailPlaceholder: string
      }
      actions: {
        submit: string
      }
      toast: {
        preview: string
        success: string
      }
    }
    loadingTitle: {
      title: string
    }
    miniHeader: {
      mobileSectionSidebar: string
    }
    formHeader: {
      logoutWithId: string
    }
    sectionSidebar: {
      skipToSection: string
      formSections: string
      jumpToSection: string
      listOfSections: string
      navigatedToSection: string
    }
    sidebarLink: {
      navigateToSection: string
    }
    singleSubmissionModal: {
      title: string
      logoutLoading: string
      backToLogin: string
    }
  }
}

export * from './ms-sg'
export * from './ta-sg'
export * from './zh-sg'
