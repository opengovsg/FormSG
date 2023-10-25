import { UseControllerProps } from 'react-hook-form'

import {
  WORKSPACE_MAX_TITLE_LENGTH,
  WORKSPACE_MIN_TITLE_LENGTH,
} from '~shared/constants'

export const WORKSPACE_TITLE_VALIDATION_RULES: UseControllerProps['rules'] = {
  required: 'Folder name is required',
  maxLength: {
    value: WORKSPACE_MAX_TITLE_LENGTH,
    message: `Folder name should contain less than ${WORKSPACE_MAX_TITLE_LENGTH} characters`,
  },
  pattern: {
    value: /^[a-zA-Z0-9_\-./() &`;'"]*$/,
    message: 'Folder name should not contain special characters',
  },
  validate: {
    trimMinLength: (value: string) => {
      return (
        value.trim().length >= WORKSPACE_MIN_TITLE_LENGTH ||
        `Folder name should contain more than ${WORKSPACE_MIN_TITLE_LENGTH} characters`
      )
    },
  },
}
