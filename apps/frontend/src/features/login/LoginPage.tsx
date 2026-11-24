import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Stack, Text } from '@chakra-ui/react'
import { FeaturesReady, useFeatureIsOn } from '@growthbook/growthbook-react'
import { StatusCodes } from 'http-status-codes'

import { featureFlags } from 'formsg-shared/constants'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { DASHBOARD_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { useToast } from '~hooks/useToast'
import { sendLoginOtp, verifyLoginOtp } from '~services/AuthService'
import Spinner from '~components/Spinner'

import {
  trackAdminLogin,
  trackAdminLoginFailure,
} from '~features/analytics/AnalyticsService'

import { LoginForm, LoginFormInputs } from './components/LoginForm'
import { ONE_LOGIN_URL, OneLoginButton } from './components/OneLoginButton'
import { OrDivider } from './components/OrDivider'
import { OtpForm, OtpFormInputs } from './components/OtpForm'
import { SgidLoginButton } from './components/SgidLoginButton'
import { WogadLoginButton } from './components/WogadLoginButton'
import { LoginPageTemplate } from './LoginPageTemplate'

export type LoginOtpData = {
  email: string
}

const FLAGS_TIMEOUT_MS = 3000

const LoginOptionButtons = ({
  shouldShowOneLogin,
}: {
  shouldShowOneLogin: boolean
}) => {
  // RATIONALE: flags load after first paint, and the flag-off buttons must
  // not flash for flag-on admins. If flags never load, fall back to flag off.
  return (
    <FeaturesReady timeout={FLAGS_TIMEOUT_MS}>
      <Stack spacing="1rem">
        {shouldShowOneLogin ? (
          <OneLoginButton />
        ) : (
          <>
            <WogadLoginButton />
            <SgidLoginButton />
          </>
        )}
      </Stack>
    </FeaturesReady>
  )
}

export const LoginPage = (): JSX.Element => {
  const { t } = useTranslation()
  const shouldShowOneLogin = useFeatureIsOn(featureFlags.ogpSuiteSso)

  const isMobile = useIsMobile()

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
      default: {
        const code = parseInt(statusCode ?? '')
        if (code >= 500 && code < 600) {
          return t('features.common.errors.serverError')
        }
        return t('features.common.errors.generic')
      }
    }
  }, [statusCode])

  // RATIONALE: this page is the RP's initiate_login_uri, not the API endpoint,
  // so the launcher hop lands in the officer's own browser before /authorize.
  // On GSIB, Menlo keeps its remote-tab pairing in window.name; left in place,
  // the next one.gov.sg navigation re-attaches to the stale remote tab (parked
  // on this page) and bounces back here forever. The backend validates iss.
  const iss = params.get('iss')
  useEffect(() => {
    if (!iss) return
    window.name = ''
    window.location.assign(
      `${ONE_LOGIN_URL}?${new URLSearchParams({ iss }).toString()}`,
    )
  }, [iss])

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

  // Same layout as OneHoldingPage, so the launcher hop doesn't flash the form.
  if (iss) {
    return (
      <Stack spacing={4} align="center" justify="center" height="100%">
        <Spinner />
        <Text>{t('features.login.LoginPage.signingInWithOne')}</Text>
      </Stack>
    )
  }

  return (
    <LoginPageTemplate>
      {!email ? (
        <Stack gap="2rem" divider={<OrDivider />}>
          {isMobile
            ? [
                <LoginOptionButtons
                  key="buttons"
                  shouldShowOneLogin={shouldShowOneLogin}
                />,
                <LoginForm key="form" onSubmit={handleSendOtp} />,
              ]
            : [
                <LoginForm key="form" onSubmit={handleSendOtp} />,
                <LoginOptionButtons
                  key="buttons"
                  shouldShowOneLogin={shouldShowOneLogin}
                />,
              ]}
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
