import { UseControllerProps } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  WORKSPACE_MAX_TITLE_LENGTH,
  WORKSPACE_MIN_TITLE_LENGTH,
} from '~shared/constants'

export const useWorkspaceTitleValidationRules =
  (): UseControllerProps['rules'] => {
    const { t } = useTranslation('translation', {
      keyPrefix: 'utils.workspaceValidation',
    })

    return {
      required: t('required'),
      maxLength: {
        value: WORKSPACE_MAX_TITLE_LENGTH,
        message: t('maxLength', { maxTitleLength: WORKSPACE_MAX_TITLE_LENGTH }),
      },
      pattern: {
        value: /^[a-zA-Z0-9_\-./() &`;'"]*$/,
        message: t('specialCharacterPattern'),
      },
      validate: {
        trimMinLength: (value: string) => {
          return (
            value.trim().length >= WORKSPACE_MIN_TITLE_LENGTH ||
            t('minLength', { minTitleLength: WORKSPACE_MIN_TITLE_LENGTH })
          )
        },
      },
    }
  }
