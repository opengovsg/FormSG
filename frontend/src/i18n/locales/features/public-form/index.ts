import { Fields } from './fields'
import { Table } from './table'

export * from './en-sg'

export interface PublicForm {
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
    table: Table
    fields: Fields
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
  }
}

export * from './ms-sg'
export * from './ta-sg'
export * from './zh-sg'
