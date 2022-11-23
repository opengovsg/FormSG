import { useCallback } from 'react'
import { Skeleton } from '@chakra-ui/react'

import Button from '~components/Button'

import { useMutateStripeAccount } from '../../mutations'
import { useAdminFormPayments } from '../../queries'

export const StripeConnectButton = (): JSX.Element => {
  const { data: account, isLoading, hasOnboarded } = useAdminFormPayments()

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

  if (!account) {
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

  if (hasOnboarded) {
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

  // Not onboarded yet, pending state.
  return (
    <Skeleton isLoaded={!isLoading} w="fit-content">
      <Button
        isLoading={createStripeAccountMutation.isLoading}
        onClick={onLinkAccountClick}
      >
        Continue onboarding
      </Button>
    </Skeleton>
  )
}
