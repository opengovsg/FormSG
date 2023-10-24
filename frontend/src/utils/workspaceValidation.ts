import { UseControllerProps } from 'react-hook-form'

const MAX_TITLE_LENGTH = 25
const MIN_TITLE_LENGTH = 4

export const WORKSPACE_TITLE_VALIDATION_RULES: UseControllerProps['rules'] = {
  required: 'Folder name is required',
  maxLength: {
    value: MAX_TITLE_LENGTH,
    message: `Folder name should contain less than ${MAX_TITLE_LENGTH} characters`,
  },
  pattern: {
    value: /^[a-zA-Z0-9_\-./() &`;'"]*$/,
    message: 'Folder name should not contain special characters',
  },
  validate: {
    trimMinLength: (value: string) => {
      return (
        value.trim().length >= MIN_TITLE_LENGTH ||
        `Folder name should contain more than ${MIN_TITLE_LENGTH} characters`
      )
    },
  },
}
