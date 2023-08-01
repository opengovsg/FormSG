import { useCallback } from 'react'

import Button from '~components/Button'

import { useMutateStripeAccount } from '../../mutations'

export const enum StripeConnectButtonStates {
  DISABLED,
  ENABLED,
  LINKED,
}

export const StripeConnectButton = ({
  connectState,
}: {
  connectState: StripeConnectButtonStates
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

  if (connectState !== StripeConnectButtonStates.LINKED) {
    return (
      <Button
        isDisabled={connectState === StripeConnectButtonStates.DISABLED}
        isLoading={linkStripeAccountMutation.isLoading}
        onClick={onLinkAccountClick}
        colorScheme="primary"
      >
        Connect my Stripe account
      </Button>
    )
  } else {
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
}
