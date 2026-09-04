import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from '@chakra-ui/react'
import { delay } from 'lodash'

import { API_BASE_URL } from '~services/ApiService'
import Button from '~components/Button'

// The backend starts the Authorization Code + PKCE flow and 302s straight to
// the one.gov.sg IdP, so this button navigates instead of fetching an auth URL.
const ONE_LOGIN_URL = `${API_BASE_URL}/auth/one/login`

export const OneLoginButton = (): JSX.Element | null => {
  const [isNavigating, setIsNavigating] = useState(false)

  const { t } = useTranslation('translation', {
    keyPrefix: 'features.login.components.OneLoginButton',
  })

  const handleOneLogin = () => {
    setIsNavigating(true)
    delay(setIsNavigating, 3000, false)
    window.location.assign(ONE_LOGIN_URL)
  }

  return (
    <Button
      isFullWidth
      isLoading={isNavigating}
      type="submit"
      color="primary"
      onClick={handleOneLogin}
      variant="outline"
      aria-label={t('loginText')}
    >
      <Flex align="center" flexDirection="row" aria-hidden>
        <Text color="primary.500">{t('loginText')}</Text>
      </Flex>
    </Button>
  )
}
