import { UseControllerProps } from 'react-hook-form'
import validator from 'validator'

const MAX_EMAIL_LENGTH = 30

const MAX_TITLE_LENGTH = 200
const MIN_TITLE_LENGTH = 4

export const FORM_TITLE_VALIDATION_RULES: UseControllerProps['rules'] = {
  required: 'Form name is required',
  minLength: {
    value: MIN_TITLE_LENGTH,
    message: `Form name must be at least ${MIN_TITLE_LENGTH} characters`,
  },
  maxLength: {
    value: MAX_TITLE_LENGTH,
    message: `Form name must be at most ${MAX_TITLE_LENGTH} characters`,
  },
  validate: {
    trimMinLength: (value: string) => {
      return (
        value.trim().length >= MIN_TITLE_LENGTH ||
        `Form name must be at least ${MIN_TITLE_LENGTH} characters`
      )
    },
  },
}

export const REQUIRED_ADMIN_EMAIL_VALIDATION_RULES: UseControllerProps['rules'] =
  {
    validate: {
      required: (emails: string[]) => {
        return (
          emails.filter(Boolean).length > 0 ||
          'You must at least enter one email to receive responses'
        )
      },
      valid: (emails: string[]) => {
        return (
          emails.filter(Boolean).every((e) => validator.isEmail(e)) ||
          'Please enter valid email(s) (e.g. me@example.com) separated by commas, as invalid emails will not be saved'
        )
      },
      duplicate: (emails: string[]) => {
        const truthyEmails = emails.filter(Boolean)
        return (
          new Set(truthyEmails).size === truthyEmails.length ||
          'Please remove duplicate emails'
        )
      },
      maxLength: (emails: string[]) => {
        return (
          emails.filter(Boolean).length <= MAX_EMAIL_LENGTH ||
          `Please limit number of emails to ${MAX_EMAIL_LENGTH}`
        )
      },
    },
  }

export const OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES: UseControllerProps['rules'] =
  {
    ...REQUIRED_ADMIN_EMAIL_VALIDATION_RULES,
    validate: {
      ...REQUIRED_ADMIN_EMAIL_VALIDATION_RULES.validate,
      required: () => true,
    },
  }
