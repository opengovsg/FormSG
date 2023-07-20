import { useEffect, useMemo } from 'react'
import { BiLogInCircle } from 'react-icons/bi'
import { useMutation } from 'react-query'
import { useSearchParams } from 'react-router-dom'

import { DASHBOARD_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'
import { getSgidAuthUrl } from '~services/AuthService'
import Button from '~components/Button'
import { InlineMessage } from '~components/InlineMessage/InlineMessage'
import { ToastStatus } from '~components/Toast/Toast'

import { useUser } from '~features/user/queries'

import { LoginPageTemplate } from './LoginPageTemplate'

export const SgidLoginPage = (): JSX.Element => {
  const [params] = useSearchParams()
  const toast = useToast({ isClosable: true })

  const statusCode = params.get('status')
  const toastSettings:
    | {
        toastStatus: ToastStatus
        toastMessage: string
      }
    | undefined = useMemo(() => {
    switch (statusCode) {
      case null:
        return
      case '200':
        return {
          toastStatus: 'success',
          toastMessage: 'Successfully logged in.',
        }
      case '401':
        return {
          toastStatus: 'danger',
          toastMessage:
            'Your SGID-linked work email does not belong to a whitelisted public service email domain. Please use OTP login instead.',
        }
      default:
        return {
          toastStatus: 'danger',
          toastMessage: 'Something went wrong. Please try again later.',
        }
    }
  }, [statusCode])

  useEffect(() => {
    if (!toastSettings) return
    toast({
      status: toastSettings.toastStatus,
      description: toastSettings.toastMessage,
    })
  }, [toastSettings, toast])

  const { user } = useUser()

  // If redirected back here but already authed, redirect to dashboard.
  if (user) window.location.replace(DASHBOARD_ROUTE)

  const handleLoginMutation = useMutation(getSgidAuthUrl, {
    onSuccess: (data) => {
      window.location.assign(data.redirectUrl)
    },
  })

  return (
    <LoginPageTemplate>
      <InlineMessage mb="1rem">
        This is an experimental service currently offered to OGP officers only.
      </InlineMessage>
      <Button
        rightIcon={<BiLogInCircle fontSize="1.5rem" />}
        onClick={() => handleLoginMutation.mutate()}
        isLoading={handleLoginMutation.isLoading}
      >
        Log in with Singpass app
      </Button>
    </LoginPageTemplate>
  )
}
