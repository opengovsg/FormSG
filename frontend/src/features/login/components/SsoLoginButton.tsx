import { useMutation } from 'react-query'
import { Flex, Text, VStack } from '@chakra-ui/react'

import { getSsoAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

export const SsoLoginButton = (): JSX.Element | null => {
  const ssoLoginMutation = useMutation(getSsoAuthUrl, {
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl)
    },
  })

  return (
    <VStack alignItems="start">
      <Button
        isFullWidth
        isLoading={ssoLoginMutation.isLoading}
        type="submit"
        color="primary"
        onClick={() => ssoLoginMutation.mutate()}
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
