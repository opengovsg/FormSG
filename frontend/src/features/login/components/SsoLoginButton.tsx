import { useMutation } from 'react-query'
import { Flex, Text, VStack } from '@chakra-ui/react'

import { KeystoneFullLogoSvgr } from '~assets/svgrs/keystone/KeystoneFullLogoSvgr'
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
          <Text color="primary.500">Log in with </Text>
          <KeystoneFullLogoSvgr height="1.25rem" />
        </Flex>
      </Button>
      <Text>For whitelisted government users only</Text>
    </VStack>
  )
}
