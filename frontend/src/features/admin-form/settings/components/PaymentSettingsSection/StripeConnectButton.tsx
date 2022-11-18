import { useCallback } from 'react'

import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateStripeAccount } from '../../mutations'

export const StripeConnectButton = (): JSX.Element => {
  const { data: form } = useAdminForm()

  const mutateStripeAccount = useMutateStripeAccount()

  const onClick = useCallback(
    () =>
      mutateStripeAccount.mutate(undefined, {
        onSuccess: (accountLink) => {
          window.location.assign(accountLink)
        },
      }),
    [],
  )

  if (form?.payments?.target_account_id) {
    return <Button isDisabled>You are already connected</Button>
  }

  return <Button onClick={onClick} />
}
