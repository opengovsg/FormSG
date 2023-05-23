import { useCallback } from 'react'
import Stripe from 'stripe'

import Button from '~components/Button'

import { useMutateStripeAccount } from '../../mutations'

export const StripeConnectButton = ({
  stripeAccount,
  isDisabled = false,
}: {
  stripeAccount?: Stripe.Response<Stripe.Account> | null
  isDisabled?: boolean
}): JSX.Element => {
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

  if (!stripeAccount) {
    return (
      <Button
        isDisabled={isDisabled}
        isLoading={linkStripeAccountMutation.isLoading}
        onClick={onLinkAccountClick}
        colorScheme="primary"
      >
        Connect with my Stripe account
      </Button>
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
