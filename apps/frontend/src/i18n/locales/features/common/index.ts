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
  charts: string
  removeReenter: string
  share: string
  cancel: string
  title: string
  question: string
  option: string
  options: string
  optional: string
  maximum: string
  minimum: string
  exact: string
  export: string
  delete: string
  next: string
  back: string
  done: string
  submit: string
  edit: string
  sending: string
  loading: string
  loadingWithEllipsis: string
  saving: string
  response: string
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
  date: string
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
  previewFormBanner: {
    title: {
      template: string
      form: string
    }
    actions: {
      backToFormSG: string
      useTemplate: string
      templatePreviewActions: string
      returnToDashboard: string
      useTemplateAria: string
    }
    payment: {
      production: string
      nonProduction: string
    }
    nonPayment: {
      nonProduction: string
    }
  }
  moreOptions: string
  betaBadgeLabel: string
  average: string
  notApplicable: string
  file: string
  filename: string
  previous: string
  submission: string
  attachments: string
  success: string
  pending: string
  completed: string
  approved: string
  notApproved: string
  adminFormMutations: {
    collaborators: {
      errors: {
        badRequestAddOrEdit: string
        badRequestGeneric: string
        add: string
        update: string
        remove: string
        removeSelf: string
        transferOwnership: string
        generic: string
        notWhitelistedAgency: string
        unexpected422: string
      }
      collaboratorNotFound: string
      success: {
        updatedToRole: string
        addedAs: string
        removed: string
        newOwner: string
        removeSelf: string
      }
    }
    formPage: {
      headerAndInstructionsUpdated: string
      thankYouPageUpdated: string
      paymentUpdated: string
      paymentsProductUpdated: string
    }
    downloads: {
      feedbackStarted: string
      issuesStarted: string
    }
    reminders: {
      sent: string
    }
  }
}
