import { useTranslation } from 'react-i18next'
import { Stack, Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'

import { LOGIN_OPTION_COPY } from './constants'

export const LoginOptionLabel = ({ authType }: { authType: FormAuthType }) => {
  const { t } = useTranslation()
  const { labelKey, descriptionKey } = LOGIN_OPTION_COPY[authType]
  return (
    <Stack spacing="0.25rem">
      <Text>{t(labelKey)}</Text>
      {descriptionKey && (
        <Text textStyle="body-2" color="secondary.400">
          {t(descriptionKey)}
        </Text>
      )}
    </Stack>
  )
}
