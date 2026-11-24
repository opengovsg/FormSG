import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'

import { LOGIN_OPTION_COPY } from './constants'

export const LoginOptionLabel = ({ authType }: { authType: FormAuthType }) => {
  const { t } = useTranslation()
  return <Text>{t(LOGIN_OPTION_COPY[authType].optionKey)}</Text>
}
