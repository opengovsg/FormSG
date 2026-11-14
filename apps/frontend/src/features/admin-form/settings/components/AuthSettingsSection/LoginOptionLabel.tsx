import { useTranslation } from 'react-i18next'
import { Stack, Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'

import { LOGIN_OPTION_COPY } from './constants'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

export const LoginOptionLabel = ({ authType }: { authType: FormAuthType }) => {
  const { t } = useTranslation()
  const copy = LOGIN_OPTION_COPY[authType]
  if (!copy) return null
  return (
    <Stack spacing="0.25rem">
      <Text>{t(`${COPY_KEY}.${copy.labelKey}`)}</Text>
      {copy.descriptionKey && (
        <Text textStyle="body-2" color="secondary.400">
          {t(`${COPY_KEY}.${copy.descriptionKey}`)}
        </Text>
      )}
    </Stack>
  )
}
