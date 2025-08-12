import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Stack } from '@chakra-ui/react'

import { LOGIN_ROUTE } from '~constants/routes'
import Spinner from '~components/Spinner'

export const LoginCallbackForwardingPage = (): JSX.Element => {
  const [params] = useSearchParams()

  const route = params.get('route')
  const forwarded = params.get('forwarded')

  useEffect(() => {
    let redirectUrl = route ?? LOGIN_ROUTE
    if (forwarded && route) {
      // Send to the actual callback route
      const params = new URLSearchParams({
        forwarded: 'true',
      })

      redirectUrl = `${route}&${params.toString()}`
    }
    const redirectTimeout = setTimeout(() => {
      window.location.replace(redirectUrl)
    }, 1000)

    return () => clearTimeout(redirectTimeout)
  }, [route, forwarded])

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
        // divider={<Divider />}
      >
        <Spinner />
        <p>Authenticating...</p>
      </Stack>
    </Flex>
  )
}
