export * from './en-sg'

export interface EmergencyContact {
  modal: {
    header: string
    description: string
  }
  contactNumber: {
    label: string
    errors: {
      invalid: string
    }
  }
  verification: {
    label: string
    description: string
    errors: {
      required: string
      numbersOnly: string
      invalid: string
    }
  }
}
