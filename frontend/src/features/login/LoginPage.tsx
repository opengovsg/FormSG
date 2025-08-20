import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Stack } from '@chakra-ui/react'
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react'
import { StatusCodes } from 'http-status-codes'

import { featureFlags } from '~shared/constants'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { DASHBOARD_ROUTE } from '~constants/routes'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { useToast } from '~hooks/useToast'
import { sendLoginOtp, verifyLoginOtp } from '~services/AuthService'

import {
  trackAdminLogin,
  trackAdminLoginFailure,
} from '~features/analytics/AnalyticsService'

import { LoginForm, LoginFormInputs } from './components/LoginForm'
import { OrDivider } from './components/OrDivider'
import { OtpForm, OtpFormInputs } from './components/OtpForm'
import { SgidLoginButton } from './components/SgidLoginButton'
import { SsoLoginButton } from './components/SsoLoginButton'
import { LoginPageTemplate } from './LoginPageTemplate'
import { useIsIntranetCheck, useIsOgpIpCheck } from './queries'

export type LoginOtpData = {
  email: string
}

const isDev = import.meta.env.MODE === 'development'
export const LoginPage = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: isIntranetIp } = useIsIntranetCheck()
  const { data: isOgpIp } = useIsOgpIpCheck()
  const showOgpSuiteSso = useFeatureIsOn(featureFlags.ogpSuiteSso)
  const shouldShowSsoLogin = (isOgpIp && showOgpSuiteSso) || isDev
  const enableIntranetSgidLogin = useFeatureIsOn(
    featureFlags.enableIntranetSgidLogin,
  )
  const shouldShowSgidLogin = !isIntranetIp || enableIntranetSgidLogin

  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)
  const [email, setEmail] = useState<string>()
  const [otpPrefix, setOtpPrefix] = useState<string>('')

  const [params] = useSearchParams()
  const toast = useToast({ isClosable: true, status: 'danger' })

  const statusCode = params.get('status')
  const toastMessage = useMemo(() => {
    switch (statusCode) {
      case null:
        return
      case StatusCodes.OK.toString():
        {
          window.location.assign(DASHBOARD_ROUTE)
          setIsAuthenticated(true)
        }
        return
      case StatusCodes.FORBIDDEN.toString():
        return t('features.login.LoginPage.forbidden')
      case StatusCodes.UNAUTHORIZED.toString():
        return t('features.login.LoginPage.expiredSession')
      default:
        return t('features.common.errors.generic')
    }
  }, [statusCode])

  useEffect(() => {
    if (!toastMessage) return
    toast({ description: toastMessage })
  }, [toast, toastMessage])

  const handleSendOtp = async ({ email }: LoginFormInputs) => {
    const trimmedEmail = email.trim()
    await sendLoginOtp(trimmedEmail).then(({ otpPrefix }) => {
      setOtpPrefix(otpPrefix)
      setEmail(trimmedEmail)
    })
  }

  const handleVerifyOtp = async ({ otp }: OtpFormInputs) => {
    // Should not happen, since OtpForm component is only shown when there is
    // already an email state set.
    if (!email) {
      throw new Error('Something went wrong')
    }
    try {
      await verifyLoginOtp({ otp, email })
      trackAdminLogin()
      return setIsAuthenticated(true)
    } catch (error) {
      if (error instanceof Error) {
        trackAdminLoginFailure(error.message)
      }
      throw error
    }
  }

  const handleResendOtp = async () => {
    // Should not happen, since OtpForm component is only shown when there is
    // already an email state set.
    if (!email) {
      throw new Error('Something went wrong')
    }
    await sendLoginOtp(email).then(({ otpPrefix }) => setOtpPrefix(otpPrefix))
  }

  return (
    <LoginPageTemplate>
      {!email ? (
        <Stack spacing="2rem">
          {/* Only show OGP login button if user is on ogp intranet */}
          {shouldShowSsoLogin && (
            <>
              <SsoLoginButton />
              <OrDivider />
            </>
          )}
          <LoginForm onSubmit={handleSendOtp} />
          {shouldShowSgidLogin && (
            <>
              <OrDivider />
              <SgidLoginButton />
            </>
          )}
        </Stack>
      ) : (
        <OtpForm
          email={email}
          otpPrefix={otpPrefix}
          onSubmit={handleVerifyOtp}
          onResendOtp={handleResendOtp}
        />
      )}
    </LoginPageTemplate>
  )
}
