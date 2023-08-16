import { UseControllerProps } from 'react-hook-form'

const MAX_TITLE_LENGTH = 50
const MIN_TITLE_LENGTH = 4

export const WORKSPACE_TITLE_VALIDATION_RULES: UseControllerProps['rules'] = {
  required: 'Folder name is required',
  maxLength: {
    value: MAX_TITLE_LENGTH,
    message: `Folder name must be at most ${MAX_TITLE_LENGTH} characters`,
  },
  pattern: {
    value: /^[a-zA-Z0-9_\-./() &`;'"]*$/,
    message: 'Folder name cannot contain special characters',
  },
  validate: {
    trimMinLength: (value: string) => {
      return (
        value.trim().length >= MIN_TITLE_LENGTH ||
        `Folder name must be at least ${MIN_TITLE_LENGTH} characters`
      )
    },
  },
}
