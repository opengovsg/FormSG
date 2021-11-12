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
