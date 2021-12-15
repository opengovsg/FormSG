import { UseControllerProps } from 'react-hook-form'
import validator from 'validator'

const MAX_EMAIL_LENGTH = 30

export const FORM_TITLE_VALIDATION_RULES = {
  required: 'Form name is required',
  minLength: {
    value: 4,
    message: 'Form name must be at least 4 characters',
  },
  maxLength: {
    value: 200,
    message: 'Form name must be at most 200 characters',
  },
  pattern: {
    value: /^[a-zA-Z0-9_\-./() &`;'"]*$/,
    message: 'Form name cannot contain special characters',
  },
}

export const createAdminEmailValidationTransform = () => {
  const transform = {
    // Combine and display all emails in a single string in the input field.
    input: (value: string[]) => value.join(','),
    // Convert joined email string into an array of emails.
    output: (value: string) =>
      value
        .replace(/\s/g, '')
        .split(',')
        .map((v) => v.trim()),
  }

  const rules: UseControllerProps['rules'] = {
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
          'Please enter valid email(s) (e.g. me@example.com) separated by commas.'
        )
      },
      duplicate: (emails: string[]) => {
        return (
          new Set(emails).size === emails.length ||
          'Please remove duplicate emails.'
        )
      },
      maxLength: (emails: string[]) => {
        return (
          emails.length <= MAX_EMAIL_LENGTH ||
          'Please limit number of emails to 30.'
        )
      },
    },
  }

  return {
    rules,
    transform,
  }
}
