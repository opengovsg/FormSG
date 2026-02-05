import { useState } from 'react'
import { useMutation } from 'react-query'
import { Badge, Flex, Text } from '@chakra-ui/react'
import { delay } from 'lodash'

import { getWogadAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

export const WogadLoginButton = (): JSX.Element | null => {
  const [isRetryDelayWindow, setRetryDelayWindow] = useState(false)

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
      aria-label="Log in with WOG AD"
    >
      <Flex align="center" flexDirection="row" gap="0.5rem" aria-hidden>
        <Text color="primary.500">Log in with WOG AD</Text>
        <Badge colorScheme="success" variant="subtle">
          New
        </Badge>
      </Flex>
    </Button>
  )
}
