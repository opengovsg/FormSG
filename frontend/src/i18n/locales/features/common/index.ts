export * from './en-sg'

export interface Common {
  entities: {
    form: string
    template: string
    design: string
    link: string
    page: string
    field: string
    changes: string
    step: string
    paymentProof: string
    credentials: string
    product: string
  }
  save: string
  saveField: string
  create: string
  removeReenter: string
  share: string
  cancel: string
  title: string
  option: string
  optional: string
  maximum: string
  minimum: string
  exact: string
  delete: string
  back: string
  edit: string
  loading: string
  loadingWithEllipsis: string
  saving: string
  responses: string
  feedback: string
  verify: string
  verified: string
  goToDashboardCta: string
  download: string
  default: string
  errors: {
    required: string
    validValue: string
    image: {
      notProvided: string
    }
    validation: {
      mobileNoVerification: string
      emailVerification: string
      homeNo: string
    }
    pageNotFound: string
    generic: string
  }
  tooltip: {
    deleteField: string
    duplicateField: string
    editField: string
  }
  dropdown: {
    placeholder: string
  }
  days: {
    Mondays: string
    Tuesdays: string
    Wednesdays: string
    Thursdays: string
    Fridays: string
    Saturdays: string
    Sundays: string
  }
  today: string
  tomorrow: string
  yesterday: string
  formStatus: {
    closed: string
    open: string
  }
  responseMode: {
    email: string
    storage: string
  }
  formName: string
  editForm: {
    text: string
    ariaLabel: string
  }
}
