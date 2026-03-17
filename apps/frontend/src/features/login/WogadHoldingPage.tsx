import { useEffect, useRef } from 'react'
import { useMutation } from 'react-query'
import { useSearchParams } from 'react-router-dom'
import { useLocalStorage } from 'react-use'
import { Spinner, Stack } from '@chakra-ui/react'
import { StatusCodes } from 'http-status-codes'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { DASHBOARD_ROUTE, LOGIN_ROUTE } from '~constants/routes'
import { verifyWogadAuthCode } from '~services/AuthService'

const useVerifyWogadAuthCode = () => {
  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)

  const wogadAuthCodeVerifyMutation = useMutation(verifyWogadAuthCode, {
    onSuccess: () => {
      setIsAuthenticated(true)
      window.location.assign(DASHBOARD_ROUTE)
    },
    onError: () => {
      window.location.assign(`${LOGIN_ROUTE}?status=${StatusCodes.FORBIDDEN}`)
    },
  })

  return wogadAuthCodeVerifyMutation
}

export const WogadHoldingPage = () => {
  const [searchParams] = useSearchParams()

  const code = searchParams.get('code')
  const csrfToken = searchParams.get('state')

  const { mutate } = useVerifyWogadAuthCode()

  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) return
    if (code && csrfToken) {
      hasVerified.current = true
      mutate({ code, csrfToken })
    }
  }, [code, csrfToken])

  return (
    <Stack spacing={4} align="center" justify="center" height="100%">
      <Spinner fontSize="4rem" />
    </Stack>
  )
}
