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
    verifiedFieldExpired_one: string
    verifiedFieldExpired_other: string
  }
}
