export interface FormValidation {
  titleValidationRules: {
    required: string
    minLength: {
      message: string
    }
    maxLength: {
      message: string
    }
    validate: {
      trimMinLength: string
    }
  }
  requiredEmailAdminValidationRules: {
    validate: {
      required: string
      valid: string
      duplicate: string
      maxLength: string
    }
  }
}

export * from './en-sg'
