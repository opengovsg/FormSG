import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Stack, Text } from '@chakra-ui/react'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { LANDING_ROUTE } from '~constants/routes'
import Spinner from '~components/Spinner'

import { useIsRbiIpCheck } from '~features/login/queries'

const ALLOWED_FORWARDING_ROUTES = [
  '/sgid/login',
  '/mi/login',
  '/api/v3/singpass/login',
  '/api/v3/corppass/login',
  '/api/v3/auth/sgid/login/callback',
  '/api/v3/auth/sso/login/callback',
]

export const FORWARDING_DEFAULT_TIMEOUT = 1000 // Default timeout for forwarding requests from the user's browser
export const FORWARDING_RBI_TIMEOUT = 10000 // Default timeout for forwarding requests from

/**
 * RbiProxyForwardingPage is a component that facilitates the handoff between
 * a Remote Browser Isolation (RBI) proxy and the user's actual browser.
 *
 * This page helps the browser to select the most direct route to the application
 * by introducing a configurable timeout that prioritizes redirecting the user's
 * actual browser and delaying the RBI proxy's response (if applicable).
 *
 * - If the request is coming directly from the user's browser, a shorter delay is used.
 * - If the request is coming through an RBI proxy a longer delay is used in the timeout.
 * - If the redirect path is not explicitly allowed, it redirects to the landing page.
 * @constructor
 */

export const RbiProxyForwardingPage = (): JSX.Element => {
  const [params] = useSearchParams()

  // Extract the forwarded request and the loop-preventing forwarded flag
  const route = params.get('route')
  const forwarded = params.get('forwarded')

  const forwardingDefaultTimeout = useFeatureValue(
    'forwarding-default-timeout',
    FORWARDING_DEFAULT_TIMEOUT,
  )
  let forwardingRbiTimeout = useFeatureValue(
    'forwarding-rbi-timeout',
    FORWARDING_RBI_TIMEOUT,
  )

  // If the feature flag SDK is not working correctly, force a safe fallback value
  if (
    !forwardingRbiTimeout ||
    forwardingRbiTimeout < forwardingDefaultTimeout
  ) {
    // Ensure that the RBI timeout is always longer than the default timeout
    forwardingRbiTimeout = Math.max(
      forwardingDefaultTimeout + FORWARDING_DEFAULT_TIMEOUT,
      FORWARDING_RBI_TIMEOUT,
    )
  }

  // Check if the request is coming from a known Remote Browser Isolation (RBI) proxy IP
  const { data: isOnProxy } = useIsRbiIpCheck()

  useEffect(() => {
    // Set the redirect URL to the landing page by default
    let redirectUrl = LANDING_ROUTE

    // If the route is not explicitly allowed, redirect to the landing page
    const allowedRoute = ALLOWED_FORWARDING_ROUTES.find((allowedRoute) =>
      route?.startsWith(allowedRoute),
    )

    if (forwarded && route && allowedRoute) {
      // The request is to be forwarded, and the route is allowed
      try {
        // Safely parse and construct the redirect URL
        const parsedUrl = new URL(route, window.location.origin)
        parsedUrl.searchParams.set('forwarded', forwarded)
        redirectUrl = parsedUrl.toString()
      } catch {
        console.error('The RBI forwarding route is not a valid URL.')
      }
    } else {
      console.error('The RBI forwarding route is not allowed.')
    }

    // Redirect the user to the appropriate URL after a delay
    const redirectTimeout = setTimeout(
      () => {
        window.location.replace(redirectUrl)
      },
      // If the request is from an RBI proxy, use a longer timeout
      isOnProxy ? forwardingRbiTimeout : forwardingDefaultTimeout,
    )

    return () => clearTimeout(redirectTimeout)
  }, [
    route,
    forwarded,
    isOnProxy,
    forwardingRbiTimeout,
    forwardingDefaultTimeout,
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
