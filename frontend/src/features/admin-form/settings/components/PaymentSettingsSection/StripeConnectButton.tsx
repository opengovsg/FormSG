import { useCallback } from 'react'
import { Skeleton } from '@chakra-ui/react'

import Button from '~components/Button'

import { useMutateStripeAccount } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const StripeConnectButton = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  const mutateStripeAccount = useMutateStripeAccount()

  const onClick = useCallback(
    () =>
      mutateStripeAccount.mutateAsync(undefined, {
        onSuccess: ({ accountUrl }) => {
          window.location.assign(accountUrl)
        },
      }),
    [mutateStripeAccount],
  )

  if (settings?.payments?.enabled && settings?.payments?.target_account_id) {
    return <Button colorScheme="danger">Disconnect Stripe</Button>
  }

  return (
    <Skeleton isLoaded={!isLoading} w="fit-content">
      <Button isLoading={mutateStripeAccount.isLoading} onClick={onClick}>
        Connect my Stripe account to FormSG
      </Button>
    </Skeleton>
  )
}
