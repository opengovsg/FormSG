import { useState } from 'react'
import { useMutation } from 'react-query'
import { Flex, Text, VStack } from '@chakra-ui/react'
import { delay } from 'lodash'

import { getSsoAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

export const SsoLoginButton = (): JSX.Element | null => {
  const [isRetryDelayWindow, setRetryDelayWindow] = useState(false)

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
    <VStack alignItems="start">
      <Button
        isFullWidth
        isLoading={ssoLoginMutation.isLoading || isRetryDelayWindow}
        type="submit"
        color="primary"
        onClick={handleSsoLogin}
        variant="outline"
        aria-label="Log in with SSO"
      >
        <Flex align="center" flexDirection="row" aria-hidden>
          <Text color="primary.500">Log in with OGP SSO</Text>
        </Flex>
      </Button>
      <Text>For OGP officers only</Text>
    </VStack>
  )
}
