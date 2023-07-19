import { BiLogInCircle } from 'react-icons/bi'
import { useMutation } from 'react-query'

import { DASHBOARD_ROUTE } from '~constants/routes'
import { getSgidAuthUrl } from '~services/AuthService'
import Button from '~components/Button'
import { InlineMessage } from '~components/InlineMessage/InlineMessage'

import { useUser } from '~features/user/queries'

import { LoginPageTemplate } from './LoginPageTemplate'

export const SgidLoginPage = (): JSX.Element => {
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
