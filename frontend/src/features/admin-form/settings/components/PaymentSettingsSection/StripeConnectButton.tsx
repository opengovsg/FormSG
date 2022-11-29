import { useCallback } from 'react'
import { Skeleton } from '@chakra-ui/react'

import Button from '~components/Button'

import { useMutateStripeAccount } from '../../mutations'
import { useAdminFormPayments } from '../../queries'

export const StripeConnectButton = (): JSX.Element => {
  const { data, isLoading } = useAdminFormPayments()

  const { linkStripeAccountMutation, unlinkStripeAccountMutation } =
    useMutateStripeAccount()

  const onLinkAccountClick = useCallback(
    () =>
      linkStripeAccountMutation.mutateAsync(undefined, {
        onSuccess: ({ authUrl }) => {
          window.location.assign(authUrl)
        },
      }),
    [linkStripeAccountMutation],
  )

  const onUnlinkAccountClick = useCallback(
    () => unlinkStripeAccountMutation.mutate(),
    [unlinkStripeAccountMutation],
  )

  if (!data?.account) {
    return (
      <Skeleton isLoaded={!isLoading} w="fit-content">
        <Button
          isLoading={linkStripeAccountMutation.isLoading}
          onClick={onLinkAccountClick}
        >
          Connect my Stripe account to FormSG
        </Button>
      </Skeleton>
    )
  }

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
