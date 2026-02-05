import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'
import { Flex, Text } from '@chakra-ui/react'
import { delay } from 'lodash'

import { getWogadAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

export const WogadLoginButton = (): JSX.Element | null => {
  const [isRetryDelayWindow, setRetryDelayWindow] = useState(false)

  const { t } = useTranslation('translation', {
    keyPrefix: 'features.login.components.WogadLoginButton',
  })

  const handleWogadLogin = () => {
    setRetryDelayWindow(true)
    delay(setRetryDelayWindow, 3000, false)
    return wogadLoginMutation.mutate()
  }

  const wogadLoginMutation = useMutation(getWogadAuthUrl, {
    onSuccess: ({ authUrl }) => {
      window.location.assign(authUrl)
    },
  })

  return (
    <Button
      isFullWidth
      isLoading={wogadLoginMutation.isLoading || isRetryDelayWindow}
      type="submit"
      color="primary"
      onClick={handleWogadLogin}
      variant="outline"
      aria-label={t('loginText')}
    >
      <Flex align="center" flexDirection="row" aria-hidden>
        <Text color="primary.500">{t('loginText')}</Text>
      </Flex>
    </Button>
  )
}
