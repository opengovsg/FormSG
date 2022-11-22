import { useCallback } from 'react'
import { Skeleton } from '@chakra-ui/react'

import Button from '~components/Button'

import { useMutateStripeAccount } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const StripeConnectButton = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  const { createStripeAccountMutation, unlinkStripeAccountMutation } =
    useMutateStripeAccount()

  const onLinkAccountClick = useCallback(
    () =>
      createStripeAccountMutation.mutateAsync(undefined, {
        onSuccess: ({ accountUrl }) => {
          window.location.assign(accountUrl)
        },
      }),
    [createStripeAccountMutation],
  )

  const onUnlinkAccountClick = useCallback(
    () => unlinkStripeAccountMutation.mutate(),
    [unlinkStripeAccountMutation],
  )

  if (settings?.payments?.enabled && settings?.payments?.target_account_id) {
    return (
      <Button
        colorScheme="danger"
        onClick={onUnlinkAccountClick}
        isLoading={unlinkStripeAccountMutation.isLoading}
      >
        Disconnect Stripe
      </Button>
    )
  }

  return (
    <Skeleton isLoaded={!isLoading} w="fit-content">
      <Button
        isLoading={createStripeAccountMutation.isLoading}
        onClick={onLinkAccountClick}
      >
        Connect my Stripe account to FormSG
      </Button>
    </Skeleton>
  )
}
