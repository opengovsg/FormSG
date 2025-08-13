import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Stack, Text } from '@chakra-ui/react'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { LOGIN_ROUTE } from '~constants/routes'
import Spinner from '~components/Spinner'

import { useIsProxyIpCheck } from '~features/login/queries'

export const ALLOWED_CALLBACK_FORWARDING_ROUTES = [
  '/sgid/login',
  '/mi/login',
  '/api/v3/singpass/login',
  '/api/v3/corppass/login',
  '/api/v3/auth/sgid/login/callback',
  '/api/v3/auth/sso/login/callback',
]

export const LoginCallbackForwardingPage = (): JSX.Element => {
  const [params] = useSearchParams()

  const route = params.get('route')
  const forwarded = params.get('forwarded')

  const callbackForwardingDefaultTimeout = useFeatureValue(
    'callback-forwarding-default-timeout',
    1000,
  )
  const callbackForwardingProxyTimeout = useFeatureValue(
    'callback-forwarding-proxy-timeout',
    10000,
  )

  const { data: isOnProxy } = useIsProxyIpCheck()

  useEffect(() => {
    let redirectUrl = route ?? LOGIN_ROUTE

    const allowedRoute = ALLOWED_CALLBACK_FORWARDING_ROUTES.find(
      (allowedRoute) => route?.startsWith(allowedRoute),
    )

    if (forwarded && route && allowedRoute) {
      // Send to the actual callback route
      const params = new URLSearchParams({
        forwarded: 'true',
      })

      redirectUrl = `${route}&${params.toString()}`
    }
    const redirectTimeout = setTimeout(
      () => {
        window.location.replace(redirectUrl)
      },
      isOnProxy
        ? callbackForwardingProxyTimeout
        : callbackForwardingDefaultTimeout,
    )

    return () => clearTimeout(redirectTimeout)
  }, [
    route,
    forwarded,
    isOnProxy,
    callbackForwardingProxyTimeout,
    callbackForwardingDefaultTimeout,
  ])

  return (
    <Flex flex={1} justify="center" align="center" background="primary.100">
      <Stack
        width={{ base: '24.5rem', lg: '42.5rem' }}
        padding="2rem"
        borderRadius="0.5rem"
        border="1px"
        borderColor="neutral.200"
        gap="1rem"
        background="white"
        direction="row"
      >
        <Spinner />
        <Text>Verifying your identity...</Text>
      </Stack>
    </Flex>
  )
}
