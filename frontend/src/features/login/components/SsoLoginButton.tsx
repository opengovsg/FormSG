import { useState } from 'react'
import { useMutation } from 'react-query'
import { Flex, Text } from '@chakra-ui/react'
import { delay } from 'lodash'

import { getSsoAuthUrl } from '~services/AuthService'
import Button from '~components/Button'
import { useTranslation } from 'react-i18next'

export const SsoLoginButton = (): JSX.Element | null => {
  const [isRetryDelayWindow, setRetryDelayWindow] = useState(false)

  const { t } = useTranslation('translation', {
    keyPrefix: 'features.login.components.SsoLoginButton',
  })

  const handleSsoLogin = () => {
    setRetryDelayWindow(true)
    delay(setRetryDelayWindow, 3000, false)
    return ssoLoginMutation.mutate()
  }

  const ssoLoginMutation = useMutation(getSsoAuthUrl, {
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl)
    },
  })

  return (
    <Button
      isFullWidth
      isLoading={ssoLoginMutation.isLoading || isRetryDelayWindow}
      type="submit"
      color="primary"
      onClick={handleSsoLogin}
      variant="outline"
      aria-label="Log in with OGP SSO"
    >
      <Flex align="center" flexDirection="row" aria-hidden>
        <Text color="primary.500">{t('loginText')}</Text>
      </Flex>
    </Button>
  )
}
