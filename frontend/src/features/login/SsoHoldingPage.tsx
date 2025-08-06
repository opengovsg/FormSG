import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useLocalStorage } from 'react-use'
import { Stack } from '@chakra-ui/react'
import { StatusCodes } from 'http-status-codes'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { DASHBOARD_ROUTE, LOGIN_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'
import Spinner from '~components/Spinner'

export const SsoHoldingPage = () => {
  const { t } = useTranslation()

  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)

  const [params] = useSearchParams()
  const toast = useToast({ isClosable: true, status: 'danger' })

  const statusCode = params.get('status')
  const toastMessage = useMemo(() => {
    switch (statusCode) {
      case null: {
        window.location.assign(LOGIN_ROUTE)
        return
      }
      case StatusCodes.OK.toString():
        {
          window.location.assign(DASHBOARD_ROUTE)
          setIsAuthenticated(true)
        }
        return
      case StatusCodes.FORBIDDEN.toString(): {
        window.location.assign(LOGIN_ROUTE)
        return t('features.login.LoginPage.forbidden')
      }
      case StatusCodes.UNAUTHORIZED.toString(): {
        window.location.assign(LOGIN_ROUTE)
        return t('features.login.LoginPage.expiredSession')
      }
      default: {
        window.location.assign(LOGIN_ROUTE)
        return t('features.common.errors.generic')
      }
    }
  }, [statusCode, t, setIsAuthenticated])

  useEffect(() => {
    if (!toastMessage) return
    toast({ description: toastMessage })
  }, [toast, toastMessage])

  return (
    <Stack spacing={4} align="center" justify="center" height="100%">
      <Spinner fontSize="4rem" />
    </Stack>
  )
}
