import { useMutation } from 'react-query'
import { Divider, Flex, HStack, Stack, Text } from '@chakra-ui/react'

import { getSsoAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

export const SsoLoginButton = (): JSX.Element | null => {
  const ssoLoginMutation = useMutation(getSsoAuthUrl, {
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl)
    },
  })

  return (
    <>
      <HStack spacing="2.5rem">
        <Divider />
        <Text textStyle="caption-2">or</Text>
        <Divider />
      </HStack>
      <Stack gap="0.75rem">
        <Button
          colorScheme="neutral"
          height="2.75rem"
          size="xs"
          variant="outline"
          isLoading={ssoLoginMutation.isLoading}
          onClick={() => ssoLoginMutation.mutate()}
          aria-label="Log in with SSO"
        >
          <Flex align="center" flexDirection="row" aria-hidden>
            <Text>Log in with SSO</Text>
          </Flex>
        </Button>
        <Text textStyle="caption-2">For whitelisted government users only</Text>
      </Stack>
    </>
  )
}
