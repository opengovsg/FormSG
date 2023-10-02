import { useState } from 'react'
import { Stack } from '@chakra-ui/react'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { sendLoginOtp, verifyLoginOtp } from '~services/AuthService'

import {
  trackAdminLogin,
  trackAdminLoginFailure,
} from '~features/analytics/AnalyticsService'

import { LoginForm, LoginFormInputs } from './components/LoginForm'
import { OrDivider } from './components/OrDivider'
import { OtpForm, OtpFormInputs } from './components/OtpForm'
import { SgidLoginButton } from './components/SgidLoginButton'
import { LoginPageTemplate } from './LoginPageTemplate'

export type LoginOtpData = {
  email: string
}

export const LoginPage = (): JSX.Element => {
  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)
  const [email, setEmail] = useState<string>()
  const [otpPrefix, setOtpPrefix] = useState<string>('')

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
          <LoginForm onSubmit={handleSendOtp} />
          <OrDivider />
          <SgidLoginButton />
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
