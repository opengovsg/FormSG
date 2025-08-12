import { useSearchParams } from 'react-router-dom'
import { Divider, Flex, Stack } from '@chakra-ui/react'

import { LOGIN_ROUTE } from '~constants/routes'

export const LoginCallbackForwardingPage = (): JSX.Element => {
  const [params] = useSearchParams()

  const route = params.get('route')
  const forwarded = params.get('forwarded')

  if (forwarded && route) {
    // Send to the actual callback route
    const params = new URLSearchParams({
      forwarded: 'true',
    })
    window.location.replace(`${route}&${params.toString()}`)
  } else {
    // User doesn't have a valid callback, should reattempt to login
    // TODO: fix this redirect if the callback is invalid
    window.location.replace(route ?? LOGIN_ROUTE)
  }

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
        divider={<Divider />}
      >
        :)
      </Stack>
    </Flex>
  )
}
