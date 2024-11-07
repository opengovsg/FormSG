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
    PublicFormSubmitButton: {
      loadingText: string
      visuallyHidden: string
      preventSubmission: string
      proceedToPay: string
      submitNow: string
    }
    table: Table
  }
}
