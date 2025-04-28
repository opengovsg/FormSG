import { FormValidation } from '.'

export const enSG: FormValidation = {
  titleValidationRules: {
    required: 'Form name is required',
    minLength: {
      message: 'Form name must be at least {MIN_TITLE_LENGTH} characters',
    },
    maxLength: {
      message: 'Form name must be at most {MAX_TITLE_LENGTH} characters',
    },
    validate: {
      trimMinLength: 'Form name must be at least {MIN_TITLE_LENGTH} characters',
    },
  },
  requiredEmailAdminValidationRules: {
    validate: {
      required: 'You must at least enter one email to receive responses',
      valid:
        'Please enter valid email(s) (e.g. me@example.com) separated by commas, as invalid emails will not be saved',
      duplicate: 'Please remove duplicate emails',
      maxLength: 'Please limit number of emails to {maxEmailLength}',
    },
  },
}
