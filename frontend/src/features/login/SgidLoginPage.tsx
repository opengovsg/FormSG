import { useEffect } from 'react'
import { BiLogInCircle } from 'react-icons/bi'
import { useMutation } from 'react-query'
import { useSearchParams } from 'react-router-dom'
import { StatusCodes } from 'http-status-codes'

import { DASHBOARD_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'
import { getSgidAuthUrl } from '~services/AuthService'
import Button from '~components/Button'
import { InlineMessage } from '~components/InlineMessage/InlineMessage'

import { useUser } from '~features/user/queries'

import { LoginPageTemplate } from './LoginPageTemplate'

export const SgidLoginPage = (): JSX.Element => {
  const [params] = useSearchParams()
  const toast = useToast({ isClosable: true })

  const status = params.get('status')
  const message = params.get('message')

  useEffect(() => {
    if (!status || !message) return
    toast({
      status: status === StatusCodes.OK.toString() ? 'success' : 'danger',
      description: message,
    })
  }, [message, status, toast])

  const { user } = useUser()

  // If redirected back here but already authed, redirect to dashboard.
  if (user) window.location.assign(DASHBOARD_ROUTE)

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
