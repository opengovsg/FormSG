import { UseControllerProps } from 'react-hook-form'

const MAX_TITLE_LENGTH = 200
const MIN_TITLE_LENGTH = 4

export const WORKSPACE_TITLE_VALIDATION_RULES: UseControllerProps['rules'] = {
  required: 'Workspace title is required',
  minLength: {
    value: MIN_TITLE_LENGTH,
    message: `Workspace title must be at least ${MIN_TITLE_LENGTH} characters`,
  },
  maxLength: {
    value: MAX_TITLE_LENGTH,
    message: `Workspace title must be at most ${MAX_TITLE_LENGTH} characters`,
  },
  pattern: {
    value: /^[a-zA-Z0-9_\-./() &`;'"]*$/,
    message: 'Workspace title cannot contain special characters',
  },
  validate: {
    trimMinLength: (value: string) => {
      return (
        value.trim().length >= MIN_TITLE_LENGTH ||
        `Workspace title must be at least ${MIN_TITLE_LENGTH} characters`
      )
    },
  },
}
