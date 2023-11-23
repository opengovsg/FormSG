import { useCallback } from 'react'

import Button from '~components/Button'
import Tooltip from '~components/Tooltip'

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
      <Tooltip
        placement="right"
        label="Connecting to Stripe is not available on playground."
        shouldWrapChildren
      >
        <Button
          isDisabled // not available on playground
          isLoading={linkStripeAccountMutation.isLoading}
          onClick={onLinkAccountClick}
          colorScheme="primary"
        >
          Connect my Stripe account
        </Button>
      </Tooltip>
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
